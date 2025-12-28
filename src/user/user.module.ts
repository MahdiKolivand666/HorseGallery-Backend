import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from './schemas/user.schema';
import { AuthController } from './controllers/auth.controller';
import { PanelController } from './controllers/panel.controller';
import { AddressService } from './services/address.service';
import { SmsService } from 'src/shared/services/sms.service';
import { SharedModule } from 'src/shared/shared.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { Order, orderSchema } from 'src/shop/schemas/order.schema';
import {
  Address as ShopAddress,
  addressSchema as shopAddressSchema,
} from 'src/shop/schemas/address.schema';

@Module({
  controllers: [UserController, AuthController, PanelController],
  providers: [UserService, AddressService, SmsService],
  imports: [
    SharedModule, // Import SharedModule to use SecurityLogService
    ThrottlerModule, // ✅ برای استفاده از @Throttle decorator
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
      { name: Order.name, schema: orderSchema },
      { name: ShopAddress.name, schema: shopAddressSchema },
    ]),
  ],
})
export class UserModule {}
