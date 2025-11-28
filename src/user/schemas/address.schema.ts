import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';

@Schema({ timestamps: true })
export class Address extends Document {
  @Prop()
  province: string;

  @Prop()
  city: string;

  @Prop()
  address: string;

  @Prop()
  postalCode: string;

  @Prop()
  recipientName: string; // قبلاً receiverName بود

  @Prop()
  recipientMobile: string; // قبلاً receiverMobile بود

  @Prop()
  title?: string; // مثال: "خانه", "محل کار"

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user: User;
}

export const addressSchema = SchemaFactory.createForClass(Address);
