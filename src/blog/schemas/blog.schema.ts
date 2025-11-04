import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BlogCategory } from './blog-category.schema';
import { User } from 'src/user/schemas/user.schema';

@Schema({ timestamps: true })
export class Blog extends Document {
  @Prop()
  title: string;

  @Prop()
  content: string;

  @Prop()
  image: string;
  @Prop({ required: true, type: String })
  url: string;

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
BlogSchema.index({ url: 1 }, { unique: true });
BlogSchema.index({ category: 1 });
BlogSchema.index({ createdAt: -1 });
BlogSchema.index({ category: 1, createdAt: -1 }); // Compound index for category blog lists
