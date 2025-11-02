import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProductCategory } from './product-category.schema';

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop()
  title: string;

  @Prop()
  content: string;

  @Prop()
  images: string[];

  @Prop()
  thumbnail: string;

  @Prop()
  price: number;

  @Prop()
  discount: number;

  @Prop({
    type: Types.ObjectId,
    ref: ProductCategory.name,
    required: true,
  })
  category: ProductCategory;

  @Prop({
    required: false,

    default: 0,
  })
  stock: number;

  @Prop({
    required: true,
    unique: true,
    type: String,
  })
  url: string;

  @Prop({ required: false })
  weight: number; // Weight in grams

  @Prop({ required: false })
  karat: number; // Karat (18, 21, 24)

  @Prop({
    required: false,
    enum: ['دستبند', 'گردنبند', 'انگشتر', 'گوشواره', 'پابند', 'سایر'],
  })
  type: string; // Jewelry type

  @Prop({
    required: false,
    enum: ['طلای زرد', 'طلای سفید', 'طلای رزگلد'],
  })
  material: string; // Gold type

  @Prop({ required: false })
  dimensions: string; // Dimensions

  @Prop({ default: false })
  hasCertificate: boolean; // Has authenticity certificate

  @Prop({ required: false })
  certificateNumber: string; // Certificate number
}

export const productSchema = SchemaFactory.createForClass(Product);
