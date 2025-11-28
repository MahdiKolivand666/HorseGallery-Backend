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

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  total: number;
}

export const cartSchema = SchemaFactory.createForClass(Cart);
