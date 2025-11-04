import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from './schemas/user.schema';
import { AuthController } from './controllers/auth.controller';
import { PanelController } from './controllers/panel.controller';
import { Address, addressSchema } from './schemas/address.schema';
import { AddressService } from './services/address.service';
import { JwtModule } from '@nestjs/jwt';
import { SmsService } from 'src/shared/services/sms.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  controllers: [UserController, AuthController, PanelController],
  providers: [UserService, AddressService, SmsService],
  imports: [
    SharedModule, // Import SharedModule to use SecurityLogService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: userSchema },
      { name: Address.name, schema: addressSchema },
    ]),
  ],
})
export class UserModule {}
