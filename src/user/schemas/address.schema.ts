import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';

@Schema({ timestamps: true })
export class Address extends Document {
  @Prop()
  content: string;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user: User;
}

export const addressSchema = SchemaFactory.createForClass(Address);
