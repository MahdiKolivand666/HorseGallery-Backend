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
  receiverName: string;

  @Prop()
  receiverMobile: string;

  // Legacy field - kept for backward compatibility
  @Prop()
  content?: string;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user: User;
}

export const addressSchema = SchemaFactory.createForClass(Address);
