import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';

@Schema({
  timestamps: true,
})
export class Cart extends Document {
  declare _id: Types.ObjectId;
  @Prop({ required: true, ref: User.name, type: Types.ObjectId })
  user: string;
}

export const cartSchema = SchemaFactory.createForClass(Cart);
