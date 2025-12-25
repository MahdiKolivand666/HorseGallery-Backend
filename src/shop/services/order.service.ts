import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderStatus } from '../schemas/order.schema';
import { Model, Types } from 'mongoose';
import { OrderItem } from '../schemas/order-item.schema';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { CartService } from './cart.service';
import { ShippingService } from './shipping.service';
import axios, { AxiosError } from 'axios';
import { ProductService } from 'src/product/services/product.service';
import { EditedBy } from 'src/product/schemas/inventory-record.schema';
import { OrderQueryDto } from '../dtos/order-query.dto';
import { sortFunction } from 'src/shared/utils/sort-utils';
import { calculateItemTotal } from 'src/shared/utils/price-calculator';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(OrderItem.name)
    private readonly orderItemModel: Model<OrderItem>,
    private readonly cartService: CartService,
    private readonly shippingService: ShippingService,
    private readonly productService: ProductService,
    private readonly configService: ConfigService,
  ) {}

  async createOrder(body: CreateOrderDto, user: string) {
    const { cartId, addressId, shippingId } = body;

    this.logger.debug(
      `Creating order for user ${user}, cart ${cartId}, address ${addressId}, shipping ${shippingId}`,
    );

    // Check if we're in development mode with test merchant
    const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
    const merchantId = this.configService.get<string>('MERCHANT_ID');
    const isDevelopment = nodeEnv !== 'production';
    const isTestMerchant =
      !merchantId ||
      merchantId === 'your-merchant-id-here' ||
      merchantId.includes('test') ||
      merchantId.includes('sandbox');

    // Generate idempotency key based on user and cart (without timestamp)
    const idempotencyKey = `order_${user}_${cartId}`;

    // Check if there's already a pending/paying order for this user and cart
    const existingOrder = await this.orderModel.findOne({
      user: user,
      cart: cartId,
      status: OrderStatus.Paying,
    });

    if (existingOrder) {
      this.logger.warn(
        `Duplicate order attempt detected for user ${user}, cart ${cartId}`,
      );

      // Check if existing order is recent (within last 15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (
        existingOrder.lastPaymentAttemptAt &&
        existingOrder.lastPaymentAttemptAt > fifteenMinutesAgo
      ) {
        // Return existing order's response
        const orderId = (existingOrder._id as Types.ObjectId).toString();
        const paymentUrl =
          isDevelopment && isTestMerchant
            ? null
            : `https://www.zarinpal.com/pg/StartPay/${existingOrder.refId}`;
        return {
          success: true,
          refId: existingOrder.refId,
          orderId: orderId,
          message: 'سفارش قبلاً ثبت شده است',
          paymentUrl: paymentUrl,
          finalPrice: existingOrder.finalPrice,
        };
      } else {
        // Old order, allow retry but increment attempts
        existingOrder.paymentAttempts =
          (existingOrder.paymentAttempts || 0) + 1;
        existingOrder.lastPaymentAttemptAt = new Date();

        if (existingOrder.paymentAttempts > 5) {
          this.logger.error(
            `Payment attempts exceeded for user ${user}, cart ${cartId}`,
          );
          throw new BadRequestException(
            'تعداد تلاش‌های پرداخت بیش از حد مجاز است. لطفاً با پشتیبانی تماس بگیرید',
          );
        }

        await existingOrder.save();
        const orderId = (existingOrder._id as Types.ObjectId).toString();
        const paymentUrl =
          isDevelopment && isTestMerchant
            ? null
            : `https://www.zarinpal.com/pg/StartPay/${existingOrder.refId}`;
        return {
          success: true,
          refId: existingOrder.refId,
          orderId: orderId,
          message: 'سفارش قبلاً ثبت شده است',
          paymentUrl: paymentUrl,
          finalPrice: existingOrder.finalPrice,
        };
      }
    }

    const cart = await this.cartService.getCartDetails(cartId);
    const shipping = await this.shippingService.findOne(shippingId);

    // ✅ بررسی انقضای cart قبل از ایجاد order
    if (cart.expired) {
      // ✅ Cart منقضی شده - حذف کن و error برگردان
      await this.cartService.removeCartAndItems(cartId);
      throw new BadRequestException(
        'زمان شما تمام شده است. لطفاً مجدداً محصول را به سبد خرید اضافه کنید',
      );
    }

    // Validate cart has items
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('سبد خرید خالی است');
    }

    // Check stock availability for all items BEFORE creating order
    for (const item of cart.items) {
      const product = item?.product;
      if (!product) {
        throw new BadRequestException('محصول نامعتبر در سبد خرید');
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `موجودی ${(product as any).name || (product as any).title || 'نامشخص'} کافی نیست. موجودی فعلی: ${product.stock}`,
        );
      }
    }

    const shippingPrice =
      cart.prices.totalWithDiscount < shipping.freeShippingThreshold
        ? shipping.price
        : 0;

    this.logger.debug(
      `Cart total: ${cart.prices.totalWithDiscount}, Shipping: ${shippingPrice}, Final: ${cart.prices.totalWithDiscount + shippingPrice}`,
    );

    const order = new this.orderModel({
      user: user,
      shipping: shippingId,
      address: addressId,
      cart: cartId,
      totalWithDiscount: cart.prices.totalWithDiscount,
      totalWithoutDiscount: cart.prices.totalWithoutDiscount,
      shippingPrice: shippingPrice,
      finalPrice: cart.prices.totalWithDiscount + shippingPrice,
      idempotencyKey: idempotencyKey,
      paymentAttempts: 1,
      lastPaymentAttemptAt: new Date(),
    });

    const bankResponse = await this.createPaymentRequest(order.finalPrice);
    if (bankResponse.code === 100) {
      order.refId = bankResponse.authority;

      for (const item of cart.items) {
        const price = item?.product?.price;
        const discount =
          (item?.product as any)?.discountPrice ||
          (item?.product as any)?.discount ||
          0;
        const quantity = item?.quantity;
        const productName =
          (item?.product as any)?.name ||
          (item?.product as any)?.title ||
          'نامشخص';

        // Use helper function for consistent calculation
        const itemPrices = calculateItemTotal(price, discount, quantity);

        this.logger.debug(
          `OrderItem: ${productName} x${quantity} = ${itemPrices.priceWithDiscount} (saved: ${itemPrices.savings})`,
        );

        const orderItem = new this.orderItemModel({
          order: order._id, // Types.ObjectId
          product: item.product._id, // Types.ObjectId
          quantity: item.quantity,
          priceWithDiscount: itemPrices.priceWithDiscount,
          priceWithoutDiscount: itemPrices.priceWithoutDiscount,
        });
        await orderItem.save();

        await this.productService.removeStock(
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          item.product._id?.toString() ?? item.product.toString(),
          item.quantity,
          EditedBy.Order,
          (order._id as Types.ObjectId).toString(),
        );
      }
      await order.save();

      const orderId = (order._id as Types.ObjectId).toString();

      this.logger.log(
        `Order created successfully: ${orderId}, authority: ${order.refId}, final price: ${order.finalPrice}`,
      );

      // Generate payment URL for production
      const paymentUrl =
        isDevelopment && isTestMerchant
          ? null
          : `https://www.zarinpal.com/pg/StartPay/${order.refId}`;

      return {
        success: true,
        refId: order.refId,
        orderId: orderId,
        message: 'سفارش با موفقیت ثبت شد',
        paymentUrl: paymentUrl,
        finalPrice: order.finalPrice,
      };
    } else {
      throw new BadRequestException('خطا در ایجاد درخواست پرداخت');
    }
  }

  async findOrderByRefId(refId: string) {
    const order = await this.orderModel.findOne({ refId: refId });
    if (order) {
      return order;
    } else {
      throw new NotFoundException();
    }
  }

  async findOneOrder(id: string) {
    const order = await this.orderModel.findOne({ _id: id });
    if (order) {
      return order;
    } else {
      throw new NotFoundException();
    }
  }

  async checkOrder(id: string) {
    try {
      const order = await this.findOneOrder(id);
      const merchantId = this.configService.get<string>('MERCHANT_ID');
      const bankVerifyUrl = this.configService.get<string>('BANK_VERIFY_URL');

      if (!bankVerifyUrl) {
        this.logger.error('Bank verify URL is not configured');
        throw new BadRequestException('آدرس درگاه بانکی تنظیم نشده است');
      }

      if (!merchantId) {
        this.logger.error('Merchant ID is not configured');
        throw new BadRequestException('شناسه پذیرنده تنظیم نشده است');
      }

      const bankData = {
        merchant_id: merchantId,
        amount: order.finalPrice * 10,
        authority: order.refId,
      };

      this.logger.log(
        `Verifying payment for order ${id} with authority ${order.refId}`,
      );

      const response = await axios.post(bankVerifyUrl, bankData, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response?.data?.data) {
        this.logger.log(`Payment verified successfully for order ${id}`);
        return response.data.data;
      } else {
        this.logger.warn(
          `Invalid response from bank gateway for order ${id}: ${JSON.stringify(response?.data)}`,
        );
        throw new BadRequestException('پاسخ نامعتبر از درگاه بانکی');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.code === 'ECONNABORTED') {
          this.logger.error(
            `Payment verification timeout for order ${id}`,
            axiosError.stack,
          );
          throw new BadRequestException(
            'زمان اتصال به درگاه بانکی به پایان رسید. لطفاً دوباره تلاش کنید',
          );
        } else if (axiosError.response) {
          this.logger.error(
            `Bank gateway returned error for order ${id}: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`,
            axiosError.stack,
          );
          throw new BadRequestException(
            'خطای درگاه بانکی. لطفاً با پشتیبانی تماس بگیرید',
          );
        } else {
          this.logger.error(
            `Network error while verifying payment for order ${id}: ${axiosError.message}`,
            axiosError.stack,
          );
          throw new BadRequestException(
            'خطا در ارتباط با درگاه بانکی. لطفاً اتصال اینترنت خود را بررسی کنید',
          );
        }
      }

      this.logger.error(
        `Unexpected error during payment verification for order ${id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException('خطای غیرمنتظره در تایید پرداخت');
    }
  }

  async createPaymentRequest(finalPrice: number) {
    try {
      const merchantId = this.configService.get<string>('MERCHANT_ID');
      const serverUrl = this.configService.get<string>('SERVER_URL');
      const bankUrl = this.configService.get<string>('BANK_URL');
      const nodeEnv =
        this.configService.get<string>('NODE_ENV') || 'development';

      // Development mode: Check if we should use mock payment
      const isDevelopment = nodeEnv !== 'production';
      const isTestMerchant =
        !merchantId ||
        merchantId === 'your-merchant-id-here' ||
        merchantId.includes('test') ||
        merchantId.includes('sandbox');

      if (isDevelopment && isTestMerchant) {
        this.logger.warn(
          `⚠️ Development Mode: Using mock payment gateway (amount: ${finalPrice} Toman)`,
        );
        this.logger.warn(
          `⚠️ MERCHANT_ID is not configured or is a test value. In production, use real Zarinpal merchant ID.`,
        );

        // Generate a mock authority code
        const mockAuthority = `A0000000000000000000000000000000000000${Date.now().toString().slice(-10)}`;
        return {
          code: 100,
          message: 'موفق',
          authority: mockAuthority,
        };
      }

      if (!merchantId) {
        this.logger.error('Merchant ID is not configured');
        throw new BadRequestException('شناسه پذیرنده تنظیم نشده است');
      }

      if (!serverUrl) {
        this.logger.error('Server URL is not configured');
        throw new BadRequestException('آدرس سرور تنظیم نشده است');
      }

      if (!bankUrl) {
        this.logger.error('Bank URL is not configured');
        throw new BadRequestException('آدرس درگاه بانکی تنظیم نشده است');
      }

      const bankData = {
        merchant_id: merchantId,
        amount: finalPrice * 10,
        description: 'Gold Gallery Order',
        callback_url: `${serverUrl}/site/order/callback`,
      };

      this.logger.log(
        `Creating payment request for amount ${finalPrice} Toman (${finalPrice * 10} Rials)`,
      );
      this.logger.debug(`Bank URL: ${bankUrl}`);
      this.logger.debug(`Callback URL: ${serverUrl}/site/order/callback`);

      const response = await axios.post(bankUrl, bankData, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.logger.debug(
        `Bank response status: ${response.status}, data: ${JSON.stringify(response.data)}`,
      );

      if (response?.data?.data) {
        this.logger.log(
          `Payment request created successfully with authority: ${response.data.data.authority}`,
        );
        return response.data.data;
      } else {
        this.logger.warn(
          `Invalid response from bank gateway: ${JSON.stringify(response?.data)}`,
        );
        throw new BadRequestException('پاسخ نامعتبر از درگاه بانکی');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.code === 'ECONNABORTED') {
          this.logger.error(
            `Payment request timeout for amount ${finalPrice}`,
            axiosError.stack,
          );
          throw new BadRequestException(
            'زمان اتصال به درگاه بانکی به پایان رسید. لطفاً دوباره تلاش کنید',
          );
        } else if (axiosError.response) {
          const errorData = axiosError.response.data as any;
          const errorStatus = axiosError.response.status;
          this.logger.error(
            `Bank gateway returned error: ${errorStatus} - ${JSON.stringify(errorData)}`,
            axiosError.stack,
          );

          // Log more details for debugging
          if (errorData?.errors) {
            this.logger.error(
              `Zarinpal errors: ${JSON.stringify(errorData.errors)}`,
            );
          }

          throw new BadRequestException(
            `خطای درگاه بانکی (${errorStatus}): ${errorData?.errors?.merchant_id?.[0] || errorData?.message || 'لطفاً دوباره تلاش کنید'}`,
          );
        } else {
          this.logger.error(
            `Network error while creating payment request: ${axiosError.message}`,
            axiosError.stack,
          );
          throw new BadRequestException(
            'خطا در ارتباط با درگاه بانکی. لطفاً اتصال اینترنت خود را بررسی کنید',
          );
        }
      }

      this.logger.error(
        `Unexpected error during payment request creation`,
        error instanceof Error ? error.stack : String(error),
      );
      throw new BadRequestException('خطای غیرمنتظره در ایجاد درخواست پرداخت');
    }
  }

  // Admin methods for order management
  async findAll(
    queryParams: OrderQueryDto,
    selectObject: Record<string, 0 | 1> = { __v: 0 },
  ) {
    const { limit = 10, page = 1, sort, status, userId, mobile } = queryParams;
    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }

    if (userId) {
      query.user = userId;
    }

    const sortObject = sortFunction(sort);

    let orderQuery = this.orderModel
      .find(query)
      .populate('user', { firstName: 1, lastName: 1, mobile: 1 })
      .populate('shipping', { name: 1, price: 1 })
      .populate('address')
      .sort(sortObject)
      .select(selectObject)
      .skip((page - 1) * limit)
      .limit(limit);

    // Filter by mobile if provided
    if (mobile) {
      orderQuery = orderQuery.populate({
        path: 'user',
        match: { mobile: { $regex: mobile, $options: 'i' } },
        select: { firstName: 1, lastName: 1, mobile: 1 },
      });
    }

    const orders = await orderQuery.exec();

    // Filter out orders with null users (from mobile filter)
    const filteredOrders = mobile
      ? orders.filter((order) => order.user !== null)
      : orders;

    const count = mobile
      ? filteredOrders.length
      : await this.orderModel.countDocuments(query);

    return { count, orders: filteredOrders };
  }

  async findOneOrderDetails(id: string) {
    const order = await this.orderModel
      .findById(id)
      .populate('user', { firstName: 1, lastName: 1, mobile: 1 })
      .populate('shipping', { name: 1, price: 1 })
      .populate('address')
      .select({ __v: 0 })
      .exec();

    if (!order) {
      throw new NotFoundException('سفارش یافت نشد');
    }

    const orderItems = await this.orderItemModel
      .find({ order: id })
      .populate('product', { title: 1, images: 1, price: 1, discount: 1 })
      .select({ __v: 0 })
      .exec();

    return {
      ...order.toObject(),
      items: orderItems,
    };
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await this.orderModel.findById(id);

    if (!order) {
      throw new NotFoundException('سفارش یافت نشد');
    }

    order.status = status;
    await order.save();

    return order;
  }
}
