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
  @Prop({ required: true })
  orderId: string; // شماره سفارش مثل ORD-53500

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

  // Payment fields
  @Prop({ default: 'online' })
  paymentMethod: string;

  @Prop()
  paymentGateway?: string; // 'saman', 'mellat', 'zarinpal'

  @Prop({ default: 'pending' })
  paymentStatus: string; // 'pending', 'paid', 'failed'

  @Prop()
  transactionId?: string;

  @Prop()
  refId?: string;

  @Prop({ default: 0 })
  paymentAttempts: number;

  @Prop()
  idempotencyKey?: string;

  @Prop()
  lastPaymentAttemptAt?: Date;

  @Prop()
  trackingCode?: string;

  @Prop()
  notes?: string;
}

export const orderSchema = SchemaFactory.createForClass(Order);

// Indexes for better query performance
orderSchema.index({ orderId: 1 }, { unique: true });
orderSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });
orderSchema.index({ refId: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ trackingCode: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ user: 1, status: 1 }); // Compound index for user order queries
orderSchema.index({ user: 1, createdAt: -1 }); // Compound index for user order history
