import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Seo extends Document {
  @Prop({
    required: true,
    unique: true,
    type: String,
  })
  url: string;

  @Prop()
  seoTitle: string;

  @Prop()
  seoDescription: string;

  @Prop({ required: false, default: null })
  h1: string;

  @Prop({ required: false, default: null })
  content: string;
}

export const seoSchema = SchemaFactory.createForClass(Seo);
