import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'provinces' })
export class Province extends Document {
  @Prop({ required: true, unique: true, index: true })
  externalId: number; // ID از API خارجی

  @Prop({ required: true, unique: true, index: true })
  name: string; // نام استان

  @Prop({ default: false })
  isActive: boolean; // آیا استان فعال است؟
}

export const provinceSchema = SchemaFactory.createForClass(Province);
