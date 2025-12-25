import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoldPrice, GoldPriceSchema } from './schemas/gold-price.schema';
import { GoldPriceService } from './services/gold-price.service';
import { GoldPriceFetcherService } from './services/gold-price-fetcher.service';
import { GoldPriceController } from './controllers/gold-price.controller';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [
    SharedModule, // ✅ برای استفاده از TokenBlacklistService در JwtGuard
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
  providers: [GoldPriceService, GoldPriceFetcherService],
  exports: [GoldPriceService, GoldPriceFetcherService],
})
export class GoldPriceModule {}
