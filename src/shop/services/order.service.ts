import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderStatus } from '../schemas/order.schema';
import { Model, Types } from 'mongoose';
import { OrderItem } from '../schemas/order-item.schema';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { CartService } from './cart.service';
import { ShippingService } from './shipping.service';
import axios from 'axios';
import { ProductService } from 'src/product/services/product.service';
import { EditedBy } from 'src/product/schemas/inventory-record.schema';
import { Product } from 'src/product/schemas/product.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(OrderItem.name)
    private readonly orderItemModel: Model<OrderItem>,
    private readonly cartService: CartService,
    private readonly shippingService: ShippingService,
    private readonly productService: ProductService,
  ) {}

  async createOrder(body: CreateOrderDto, user: string) {
    const { cartId, addressId, shippingId } = body;
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
      return order.refId;
    } else {
      throw new BadRequestException('در درگاه پرداخت مشکلی پیش آمده است');
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
      const bankData = {
        merchant_id: process.env.MERCHANT_ID,
        amount: order.finalPrice * 10,
        authority: order.refId,
      };

      const response = await axios.post(process.env.BANK_VERIFY_URL!, bankData);
      return response?.data?.data;
    } catch (error) {
      throw new BadRequestException('Error connecting to bank gateway');
    }
  }

  async createPaymentRequest(finalPrice: number) {
    try {
      const bankData = {
        merchant_id: process.env.MERCHANT_ID,
        amount: finalPrice * 10,
        description: 'Gold Gallery Order',
        callback_url: `${process.env.SERVER_URL}/site/order/callback`,
      };

      const response = await axios.post(process.env.BANK_URL!, bankData);
      return response?.data?.data;
    } catch (error) {
      throw new BadRequestException('Error creating payment request');
    }
  }
}
