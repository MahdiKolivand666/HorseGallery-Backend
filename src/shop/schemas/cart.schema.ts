import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { CART_EXPIRATION_MINUTES } from '../constants/cart.constants';

@Schema({
  timestamps: true,
})
export class Cart extends Document {
  declare _id: Types.ObjectId;
  @Prop({ required: false, ref: User.name, type: Types.ObjectId })
  user?: string; // برای کاربران لاگین شده

  @Prop({ required: false, index: true })
  sessionId?: string; // برای مهمان‌ها

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  total: number;

  @Prop({ type: Date, default: Date.now })
  lastActivityAt: Date; // آخرین زمان فعالیت در سبد خرید

  @Prop({ type: Date })
  expiresAt: Date; // زمان انقضای سبد خرید (CART_EXPIRATION_MINUTES دقیقه بعد از lastActivityAt)

  @Prop({ type: Date })
  expiredNotifiedAt?: Date; // زمان اولین اطلاع‌رسانی expired به کاربر (برای پاک کردن items بعد از اولین نمایش)
}

export const cartSchema = SchemaFactory.createForClass(Cart);

// Validation: یا user یا sessionId باید وجود داشته باشد
cartSchema.pre('save', function (next) {
  if (!this.user && !this.sessionId) {
    return next(new Error('سبد خرید باید یا user یا sessionId داشته باشد'));
  }

  // تنظیم expiresAt: فقط اگر وجود ندارد
  // اگر expiresAt از قبل تنظیم شده (مثلاً در updateCartActivity)، آن را تغییر نده
  // این باعث می‌شود timer فقط وقتی فعالیت واقعی انجام می‌شود reset شود
  if (!this.expiresAt) {
    // فقط اگر expiresAt وجود ندارد، timer جدید شروع کن
    const expirationTime = new Date(this.lastActivityAt || Date.now());
    expirationTime.setMinutes(
      expirationTime.getMinutes() + CART_EXPIRATION_MINUTES,
    );
    this.expiresAt = expirationTime;
  }
  // اگر expiresAt از قبل تنظیم شده، آن را تغییر نده
  // تا timer از همان زمان باقیمانده ادامه دهد (مثلاً بعد از refresh صفحه)

  next();
});

// Index برای query سریع‌تر سبدهای منقضی شده
cartSchema.index({ expiresAt: 1 });
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });
