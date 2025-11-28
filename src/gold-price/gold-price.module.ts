import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoldPrice, GoldPriceSchema } from './schemas/gold-price.schema';
import { GoldPriceService } from './services/gold-price.service';
import { GoldPriceController } from './controllers/gold-price.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GoldPrice.name, schema: GoldPriceSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [GoldPriceController],
  providers: [GoldPriceService],
  exports: [GoldPriceService],
})
export class GoldPriceModule {}

