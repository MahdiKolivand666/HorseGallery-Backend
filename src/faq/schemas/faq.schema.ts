import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class FAQ extends Document {
  @Prop({ required: true })
  question: string;

  @Prop({ required: true })
  answer: string;

  @Prop()
  category?: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  helpful: number;
}

export const FAQSchema = SchemaFactory.createForClass(FAQ);

// Indexes
FAQSchema.index({ order: 1 });
FAQSchema.index({ isActive: 1 });
FAQSchema.index({ category: 1 });
