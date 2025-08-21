import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { Shipping } from './shipping.schema';
import { Address } from 'src/user/schemas/address.schema';
import { Cart } from './cart.schema';

export enum OrderStatus {
  Paying = 'paying',
  Paid = 'paid',
  Sent = 'sent',
  Canceled = 'canceled',
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user: User;

  @Prop({
    type: Types.ObjectId,
    ref: Shipping.name,
    required: true,
  })
  shipping: Shipping;

  @Prop({
    type: Types.ObjectId,
    ref: Address.name,
    required: true,
  })
  address: Address;

  @Prop({
    type: Types.ObjectId,
    ref: Cart.name,
    required: false,
  })
  cart: Cart;

  @Prop({ default: OrderStatus.Paying })
  status: OrderStatus;

  @Prop()
  shippingPrice: number;

  @Prop()
  totalWithDiscount: number;

  @Prop()
  totalWithoutDiscount: number;

  @Prop()
  finalPrice: number;

  @Prop({ required: false, default: null })
  refId: string;
}

export const orderSchema = SchemaFactory.createForClass(Order);
