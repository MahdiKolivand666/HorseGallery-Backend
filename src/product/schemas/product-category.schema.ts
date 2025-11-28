import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ProductCategory extends Document {
  @Prop({ required: true })
  name: string; // قبلاً title بود

  @Prop({ required: true })
  slug: string; // قبلاً url بود

  @Prop()
  heroImage: string; // قبلاً image بود

  @Prop()
  content: string; // نگه دار

  @Prop({ type: [{ name: String, slug: String }] })
  subcategories?: Array<{ name: string; slug: string }>;
}

export const productCategorySchema =
  SchemaFactory.createForClass(ProductCategory);

// Indexes
productCategorySchema.index({ slug: 1 }, { unique: true });
