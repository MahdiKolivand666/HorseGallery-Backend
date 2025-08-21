import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SeoDto } from '../dtos/seo.dto';
import { SeoQueryDto } from '../dtos/seo-query.dto';
import { SeoService } from '../services/seo.service';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { UrlPipe } from 'src/shared/pipes/url.pipe';
import { RoleGuard } from 'src/shared/guards/role.guard';
import { Role } from 'src/user/schemas/user.schema';

@ApiTags('Seo')
@UseGuards(JwtGuard, new RoleGuard([Role.Admin, Role.CopyWriter]))
@ApiBearerAuth()
@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get()
  findAll(@Query() queryParams: SeoQueryDto) {
    return this.seoService.findAll(queryParams, { __v: 0 });
  }

  @Post()
  create(@Body(UrlPipe) body: SeoDto) {
    return this.seoService.create(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.seoService.findOne(id, { __v: 0 });
  }

  @Patch(':id')
  edit(@Param('id') id: string, @Body(UrlPipe) body: SeoDto) {
    return this.seoService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.seoService.delete(id);
  }
}
