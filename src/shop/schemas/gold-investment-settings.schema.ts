import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GoldInvestmentSettingsDocument = GoldInvestmentSettings & Document;

@Schema({ timestamps: true, collection: 'gold_investment_settings' })
export class GoldInvestmentSettings extends Document {
  @Prop({ required: true, min: 0 })
  minAmount: number; // حداقل مبلغ خرید (تومان)

  @Prop({ required: true, min: 0 })
  maxAmount: number; // حداکثر مبلغ خرید (تومان)

  @Prop({ min: 0, max: 100 })
  commission?: number; // کارمزد خرید (درصد) - اختیاری

  @Prop({ min: 0 })
  commissionAmount?: number; // کارمزد خرید (مبلغ ثابت - اختیاری)

  @Prop()
  restrictionsLink?: string; // لینک محدودیت‌های خرید و فروش (اختیاری)

  @Prop({ type: String, default: 'singleton', unique: true })
  _singleton?: string; // برای اطمینان از یکتا بودن تنظیمات
}

export const GoldInvestmentSettingsSchema = SchemaFactory.createForClass(
  GoldInvestmentSettings,
);
