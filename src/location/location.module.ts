import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationController } from './controllers/location.controller';
import { LocationService } from './services/location.service';
import { Province, provinceSchema } from './schemas/province.schema';
import { City, citySchema } from './schemas/city.schema';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [
    SharedModule, // ✅ برای استفاده از TokenBlacklistService و JwtModule در JwtGuard
    MongooseModule.forFeature([
      { name: Province.name, schema: provinceSchema },
      { name: City.name, schema: citySchema },
    ]),
  ],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
