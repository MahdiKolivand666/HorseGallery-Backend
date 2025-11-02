import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ProductCategory } from './product-category.schema';

export enum ProductType {
  Ring = 'ring',
  Necklace = 'necklace',
  Bracelet = 'bracelet',
  Earring = 'earring',
  Coin = 'coin',
  Bar = 'bar',
  Other = 'other',
}

export enum MaterialType {
  Gold = 'gold',
  Silver = 'silver',
  Platinum = 'platinum',
  Diamond = 'diamond',
  Gemstone = 'gemstone',
  Mixed = 'mixed',
}

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  price: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  stock: number;

  @Prop({ default: 1 })
  version: number;

  @Prop({ required: true })
  description: string;

  @Prop()
  images: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProductCategory' })
  category: ProductCategory;

  // Gold/Jewelry specific fields
  @Prop()
  weight?: number;

  @Prop()
  karat?: number;

  @Prop({ enum: ProductType })
  type?: ProductType;

  @Prop({ enum: MaterialType })
  material?: MaterialType;

  @Prop()
  dimensions?: string;

  @Prop({ default: false })
  hasCertificate?: boolean;

  @Prop()
  certificateNumber?: string;
}

export const productSchema = SchemaFactory.createForClass(Product);

// Indexes for better query performance
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ isAvailable: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1, isAvailable: 1 }); // Compound index for common queries
productSchema.index({ slug: 1, isAvailable: 1 }); // Compound index for product detail

// Optimistic locking
productSchema.pre('save', function (next) {
  if (this.isModified('stock')) {
    this.increment();
  }
  next();
});
