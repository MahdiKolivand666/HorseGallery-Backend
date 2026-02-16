import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { Shipping } from './shipping.schema';
import { Address } from './address.schema';
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

/**
 * تولید orderId منحصر به فرد
 */
function generateOrderId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');

  return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
}

/**
 * Pre-save hook برای تولید خودکار orderId
 */
orderSchema.pre('save', async function (next) {
  // ✅ فقط اگر orderId وجود نداشته باشد، تولید کن
  if (!this.orderId) {
    let orderId = generateOrderId();

    // ✅ بررسی اینکه orderId منحصر به فرد است
    const OrderModel = this.constructor as any;
    let existingOrder = await OrderModel.findOne({ orderId });

    // اگر orderId تکراری بود، یک عدد تصادفی دیگر اضافه کن
    let attempts = 0;
    while (existingOrder && attempts < 10) {
      orderId = `${orderId}-${Math.floor(Math.random() * 1000)}`;
      existingOrder = await OrderModel.findOne({ orderId });
      attempts++;
    }

    // اگر بعد از 10 تلاش هنوز تکراری بود، timestamp اضافه کن
    if (existingOrder) {
      orderId = `${orderId}-${Date.now()}`;
    }

    this.orderId = orderId;
  }
  next();
});

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
