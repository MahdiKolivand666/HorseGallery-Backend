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
        // Return existing order's refId
        return existingOrder.refId;
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
        return existingOrder.refId;
      }
    }

    const cart = await this.cartService.getCartDetails(cartId);
    const shipping = await this.shippingService.findOne(shippingId);
    const shippingPrice =
      cart.prices.totalWithDiscount < shipping.freeShippingThreshold
        ? shipping.price
        : 0;

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
        const discount = item?.product?.discount;
        const quantity = item?.quantity;

        const discountedPrice = price - price * (discount / 100);
        const itemPriceWithDiscount = discountedPrice * quantity;
        const itemPriceWithoutDiscount = price * quantity;

        const orderItem = new this.orderItemModel({
          order: order._id, // Types.ObjectId
          product: item.product._id, // Types.ObjectId
          quantity: item.quantity,
          priceWithDiscount: itemPriceWithDiscount,
          priceWithoutDiscount: itemPriceWithoutDiscount,
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

      this.logger.log(
        `Order created successfully: ${(order._id as Types.ObjectId).toString()}, authority: ${order.refId}`,
      );

      return order.refId;
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
        callback_url: `${serverUrl}/site-order/callback`,
      };

      this.logger.log(
        `Creating payment request for amount ${finalPrice} Toman`,
      );

      const response = await axios.post(bankUrl, bankData, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });

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
          this.logger.error(
            `Bank gateway returned error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`,
            axiosError.stack,
          );
          throw new BadRequestException(
            'خطای درگاه بانکی. لطفاً دوباره تلاش کنید',
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
