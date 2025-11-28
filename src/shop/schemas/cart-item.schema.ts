import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from 'src/product/schemas/product.schema';
import { Cart } from './cart.schema';

@Schema({
  timestamps: true,
})
export class CartItem extends Document {
  @Prop({ required: true, ref: Product.name, type: Types.ObjectId })
  product: Product;

  @Prop({ required: false, default: 1 })
  quantity: number;

  @Prop({ required: true, ref: Cart.name, type: Types.ObjectId })
  cart: Cart;

  @Prop()
  size?: string;

  @Prop({ required: true })
  price: number; // قیمت در زمان افزودن
}

export const cartItemSchema = SchemaFactory.createForClass(CartItem);
