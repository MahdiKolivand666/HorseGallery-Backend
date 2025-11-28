import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class GoldPrice extends Document {
  @Prop({ required: true })
  karat: number; // 18, 21, 24

  @Prop({ required: true })
  pricePerGram: number;

  @Prop({ required: true })
  date: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  source?: string;
}

export const GoldPriceSchema = SchemaFactory.createForClass(GoldPrice);

// Indexes
GoldPriceSchema.index({ karat: 1, date: -1 });
GoldPriceSchema.index({ isActive: 1 });

