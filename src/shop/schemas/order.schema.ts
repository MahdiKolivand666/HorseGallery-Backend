import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
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
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Shipping',
    required: true,
  })
  shipping: Shipping;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Address',
    required: true,
  })
  address: Address;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Cart', required: true })
  cart: Cart;

  @Prop({ required: true })
  totalWithDiscount: number;

  @Prop({ required: true })
  totalWithoutDiscount: number;

  @Prop({ required: true })
  shippingPrice: number;

  @Prop({ required: true })
  finalPrice: number;

  @Prop({ default: OrderStatus.Paying })
  status: OrderStatus;

  @Prop()
  refId: string;

  @Prop({ default: 0 })
  paymentAttempts: number;

  @Prop()
  idempotencyKey: string;

  @Prop()
  lastPaymentAttemptAt: Date;
}

export const orderSchema = SchemaFactory.createForClass(Order);

// Create index for idempotency key
orderSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
