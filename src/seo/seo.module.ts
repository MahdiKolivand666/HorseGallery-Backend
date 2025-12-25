import { Module } from '@nestjs/common';
import { SeoController } from './controllers/seo.controller';
import { SeoService } from './services/seo.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Seo, seoSchema } from './schemas/seo.schema';
import { SiteSeoController } from './controllers/site-seo.controller';
import { JwtModule } from '@nestjs/jwt';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  controllers: [SeoController, SiteSeoController],
  providers: [SeoService],
  imports: [
    SharedModule, // ✅ برای استفاده از TokenBlacklistService در JwtGuard
    JwtModule,
    MongooseModule.forFeature([{ name: Seo.name, schema: seoSchema }]),
  ],
})
export class SeoModule {}
