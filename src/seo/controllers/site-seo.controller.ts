import { Controller, Get, Query } from '@nestjs/common';
import { SeoService } from '../services/seo.service';
import { ApiTags } from '@nestjs/swagger';
import { SeoQueryDto } from '../dtos/seo-query.dto';
import { UrlPipe } from 'src/shared/pipes/url.pipe';

@ApiTags('Site Seo')
@Controller('site/seo')
export class SiteSeoController {
  constructor(private readonly seoService: SeoService) {}
  @Get()
  getSeoItem(@Query(UrlPipe) queryParams: SeoQueryDto) {
    if (typeof queryParams.url !== 'string') {
      throw new Error('URL parameter is required');
    }
    return this.seoService.findOneWithUrl(queryParams.url);
  }
}
