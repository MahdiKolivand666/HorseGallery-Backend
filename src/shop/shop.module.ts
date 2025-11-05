import { Module } from '@nestjs/common';
import { CartController } from './controllers/cart.controller';
import { CartService } from './services/cart.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, cartSchema } from './schemas/cart.schema';
import { CartItem, cartItemSchema } from './schemas/cart-item.schema';
import { Shipping, ShippingSchema } from './schemas/shipping.schema';
import { ShippingController } from './controllers/shipping.controller';
import { SiteShippingController } from './controllers/site-shipping.controller';
import { ShippingService } from './services/shipping.service';
import { Order, orderSchema } from './schemas/order.schema';
import { OrderItem, orderItemSchema } from './schemas/order-item.schema';
import { SiteOrderController } from './controllers/site-order.controller';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { ProductModule } from 'src/product/product.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  controllers: [
    CartController,
    ShippingController,
    SiteShippingController,
    SiteOrderController,
    OrderController,
  ],
  providers: [CartService, ShippingService, OrderService],
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    ProductModule,
    MongooseModule.forFeature([
      { name: Cart.name, schema: cartSchema },
      { name: CartItem.name, schema: cartItemSchema },
      { name: Shipping.name, schema: ShippingSchema },
      { name: Order.name, schema: orderSchema },
      { name: OrderItem.name, schema: orderItemSchema },
    ]),
  ],
})
export class ShopModule {}
