import { Module } from '@nestjs/common';
import { SeoController } from './controllers/seo.controller';
import { SeoService } from './services/seo.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Seo, seoSchema } from './schemas/seo.schema';
import { SiteSeoController } from './controllers/site-seo.controller';

@Module({
  controllers: [SeoController, SiteSeoController],
  providers: [SeoService],
  imports: [MongooseModule.forFeature([{ name: Seo.name, schema: seoSchema }])],
})
export class SeoModule {}
