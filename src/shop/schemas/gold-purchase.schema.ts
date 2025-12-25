import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';

@Schema({
  timestamps: true,
  collection: 'gold_purchases',
})
export class GoldPurchase extends Document {
  declare _id: Types.ObjectId;

  @Prop({ required: false, ref: User.name, type: Types.ObjectId })
  user?: string; // برای کاربران لاگین شده

  @Prop({ required: false, index: true })
  sessionId?: string; // برای مهمان‌ها

  @Prop({ required: true })
  originalAmount: number; // مبلغ اصلی وارد شده (بدون کارمزد)

  @Prop({ required: true })
  commissionAmount: number; // کارمزد محاسبه شده

  @Prop({ required: true })
  calculatedAmount: number; // مبلغ نهایی (شامل کارمزد)

  @Prop({ required: true })
  goldPricePerGram: number; // قیمت لحظه‌ای طلا در زمان خرید

  @Prop({ required: true })
  grams: number; // مقدار طلا به گرم

  @Prop({ required: true })
  milligrams: number; // مقدار طلا به میلی‌گرم

  @Prop({ required: true })
  commissionType: 'percentage' | 'fixed' | 'none'; // نوع کارمزد

  @Prop({ required: true })
  commissionValue: number; // مقدار کارمزد (درصد یا مبلغ ثابت)

  @Prop({ type: Date, default: Date.now })
  lastActivityAt: Date; // آخرین زمان فعالیت

  @Prop({ type: Date })
  expiresAt: Date; // زمان انقضا (10 دقیقه بعد از lastActivityAt)
}

export const GoldPurchaseSchema = SchemaFactory.createForClass(GoldPurchase);

// Validation: یا user یا sessionId باید وجود داشته باشد
GoldPurchaseSchema.pre('save', function (next) {
  if (!this.user && !this.sessionId) {
    return next(
      new Error('طلای خریداری شده باید یا user یا sessionId داشته باشد'),
    );
  }

  // تنظیم expiresAt: 10 دقیقه بعد از lastActivityAt
  if (!this.expiresAt || this.isModified('lastActivityAt')) {
    const expirationTime = new Date(this.lastActivityAt || Date.now());
    expirationTime.setMinutes(expirationTime.getMinutes() + 10);
    this.expiresAt = expirationTime;
  }

  next();
});

// Indexes
GoldPurchaseSchema.index({ expiresAt: 1 });
GoldPurchaseSchema.index({ user: 1 });
GoldPurchaseSchema.index({ sessionId: 1 });
GoldPurchaseSchema.index({ user: 1, expiresAt: 1 });
GoldPurchaseSchema.index({ sessionId: 1, expiresAt: 1 });
