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
import { Product, productSchema } from 'src/product/schemas/product.schema';
import { ProductModule } from 'src/product/product.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CartCleanupService } from './services/cart-cleanup.service';
import { OptionalJwtGuard } from 'src/shared/guards/optional-jwt.guard';
import { CompleteRegistrationGuard } from 'src/shared/guards/complete-registration.guard';
import { Address, addressSchema } from './schemas/address.schema';
import { User, userSchema } from 'src/user/schemas/user.schema';
import { AddressService } from './services/address.service';
import { SiteAddressController } from './controllers/site-address.controller';
import { GoldPriceModule } from 'src/gold-price/gold-price.module';
import { GoldInvestmentService } from './services/gold-investment.service';
import { SiteGoldInvestmentController } from './controllers/site-gold-investment.controller';
import { GoldInvestmentController } from './controllers/gold-investment.controller';
import {
  GoldInvestmentSettings,
  GoldInvestmentSettingsSchema,
} from './schemas/gold-investment-settings.schema';
import { GoldInvestmentSettingsService } from './services/gold-investment-settings.service';
import {
  GoldPurchase,
  GoldPurchaseSchema,
} from './schemas/gold-purchase.schema';
import { GoldPurchaseService } from './services/gold-purchase.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  controllers: [
    CartController,
    ShippingController,
    SiteShippingController,
    SiteOrderController,
    OrderController,
    SiteAddressController,
    SiteGoldInvestmentController,
    GoldInvestmentController,
  ],
  providers: [
    CartService,
    ShippingService,
    OrderService,
    CartCleanupService,
    AddressService,
    GoldInvestmentService,
    GoldInvestmentSettingsService,
    GoldPurchaseService,
    OptionalJwtGuard, // ✅ اضافه شد برای استفاده در CartController
    CompleteRegistrationGuard, // ✅ Guard برای بررسی registrationStatus
  ],
  imports: [
    SharedModule, // ✅ برای استفاده از TokenBlacklistService در Guards
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    ProductModule,
    GoldPriceModule,
    MongooseModule.forFeature([
      { name: Cart.name, schema: cartSchema },
      { name: CartItem.name, schema: cartItemSchema },
      { name: Shipping.name, schema: ShippingSchema },
      { name: Order.name, schema: orderSchema },
      { name: OrderItem.name, schema: orderItemSchema },
      { name: Address.name, schema: addressSchema },
      { name: Product.name, schema: productSchema },
      {
        name: GoldInvestmentSettings.name,
        schema: GoldInvestmentSettingsSchema,
      },
      {
        name: GoldPurchase.name,
        schema: GoldPurchaseSchema,
      },
      { name: User.name, schema: userSchema }, // ✅ برای CompleteRegistrationGuard
    ]),
  ],
})
export class ShopModule {}
