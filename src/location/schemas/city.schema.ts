import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Province } from './province.schema';

@Schema({ timestamps: true, collection: 'cities' })
export class City extends Document {
  @Prop({ required: true, index: true })
  externalId: number; // ID از API خارجی (unique نیست چون ممکن است در استان‌های مختلف تکرار شود)

  @Prop({ required: true, index: true })
  name: string; // نام شهر

  @Prop({
    type: Types.ObjectId,
    ref: 'Province',
    required: true,
    index: true,
  })
  province: Types.ObjectId; // استان مربوطه

  @Prop({ required: true, index: true })
  provinceExternalId: number; // ID استان از API خارجی (برای query سریع‌تر)

  @Prop({ default: false })
  isActive: boolean; // آیا شهر فعال است؟
}

export const citySchema = SchemaFactory.createForClass(City);

// Index برای query سریع‌تر
citySchema.index({ provinceExternalId: 1, isActive: 1 });
citySchema.index({ province: 1, isActive: 1 });
// Compound unique index: externalId + provinceExternalId (یک شهر نمی‌تواند در یک استان duplicate باشد)
citySchema.index({ externalId: 1, provinceExternalId: 1 }, { unique: true });
