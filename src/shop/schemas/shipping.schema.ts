import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Shipping extends Document {
  @Prop()
  title: string;

  @Prop()
  price: number;

  @Prop({ required: false, default: null })
  freeShippingThreshold: number;
}

export const ShippingSchema = SchemaFactory.createForClass(Shipping);
