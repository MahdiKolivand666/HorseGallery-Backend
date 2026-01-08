import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Shipping extends Document {
  @Prop()
  title: string;

  @Prop({ required: false })
  description?: string; // ✅ توضیحات روش ارسال

  @Prop()
  price: number;

  @Prop({ required: false, default: null })
  freeShippingThreshold: number;

  @Prop({ required: false })
  estimatedDays?: number; // ✅ تعداد روزهای تخمینی ارسال

  @Prop({ default: true })
  isActive: boolean; // ✅ آیا روش ارسال فعال است

  @Prop({ default: false })
  isDefault: boolean; // ✅ آیا روش ارسال پیش‌فرض است
}

export const ShippingSchema = SchemaFactory.createForClass(Shipping);
