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
}

export const productSchema = SchemaFactory.createForClass(Product);
