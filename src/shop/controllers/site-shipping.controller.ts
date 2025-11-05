import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ShippingService } from '../services/shipping.service';
import { ShippingQueryDto } from '../dtos/shipping-query.dto';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Site Shipping')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('site/shipping')
export class SiteShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get()
  findAll(@Query() queryParams: ShippingQueryDto) {
    return this.shippingService.findAll(queryParams);
  }
}
