import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  timestamps: true,
})
export class BlogCategory extends Document {
  @Prop()
  title: string;
  @Prop()
  content: string;

  @Prop()
  image: string;
  @Prop({ required: true, type: String })
  slug: string; // قبلاً url بود
}

export const BlogCategorySchema = SchemaFactory.createForClass(BlogCategory);

// Indexes
BlogCategorySchema.index({ slug: 1 }, { unique: true });
