import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Announcement extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop()
  link?: string;

  @Prop({
    type: {
      text: String,
      color: String,
    },
  })
  badge: {
    text: string;
    color: string; // red, yellow, green, orange
  };

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop({ default: 0 })
  order: number;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);

// Indexes
AnnouncementSchema.index({ isActive: 1, startDate: -1 });
AnnouncementSchema.index({ order: 1 });
