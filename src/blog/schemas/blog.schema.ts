import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BlogCategory } from './blog-category.schema';
import { User } from 'src/user/schemas/user.schema';

@Schema({ timestamps: true })
export class Blog extends Document {
  @Prop()
  title: string;

  @Prop({ required: true })
  slug: string; // قبلاً url بود

  @Prop({ required: true })
  excerpt: string; // خلاصه مقاله

  @Prop()
  content: string;

  @Prop()
  image: string;

  @Prop({ type: [String] })
  tags?: string[];

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop()
  publishedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: BlogCategory.name, required: true })
  category: BlogCategory;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user: User;
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

// Indexes for better query performance
BlogSchema.index({ slug: 1 }, { unique: true });
BlogSchema.index({ category: 1 });
BlogSchema.index({ isFeatured: 1 });
BlogSchema.index({ publishedAt: -1 });
BlogSchema.index({ views: -1 });
BlogSchema.index({ createdAt: -1 });
BlogSchema.index({ category: 1, createdAt: -1 }); // Compound index for category blog lists
