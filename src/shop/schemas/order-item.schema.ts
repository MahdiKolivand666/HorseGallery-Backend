import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from 'src/product/schemas/product.schema';
import { Order } from './order.schema';

@Schema({ timestamps: true })
export class OrderItem extends Document {
  // @Prop({
  //   type: Types.ObjectId,
  //   ref: Product.name,
  //   required: true,
  // })
  // product: Product;

  @Prop({ required: false, default: 1 })
  quantity: number;

  // @Prop({
  //   type: Types.ObjectId,
  //   ref: Order.name,
  //   required: true,
  // })
  // order: Order;
  @Prop({ type: Types.ObjectId, ref: Product.name, required: true })
  product: Types.ObjectId | Product;

  @Prop({ type: Types.ObjectId, ref: Order.name, required: true })
  order: Types.ObjectId | Order;

  @Prop()
  priceWithoutDiscount: number;

  @Prop({ required: true })
  priceWithDiscount: number;
}

export const orderItemSchema = SchemaFactory.createForClass(OrderItem);
