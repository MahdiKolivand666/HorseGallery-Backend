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
import { ShippingDto } from '../dtos/shipping.dto';
import { ShippingQueryDto } from '../dtos/shipping-query.dto';
import { ShippingService } from '../services/shipping.service';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { UpdateShippingDto } from '../dtos/update-shipping.dto';
import { RoleGuard } from 'src/shared/guards/role.guard';
import { Role } from 'src/user/schemas/user.schema';

@ApiTags('Shipping')
@ApiBearerAuth()
@UseGuards(JwtGuard, new RoleGuard([Role.Admin]))
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get()
  findAll(@Query() queryParams: ShippingQueryDto) {
    return this.shippingService.findAll(queryParams);
  }

  @Post()
  create(@Body() body: ShippingDto) {
    return this.shippingService.create(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shippingService.findOne(id);
  }

  @Patch(':id')
  edit(@Param('id') id: string, @Body() body: UpdateShippingDto) {
    return this.shippingService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.shippingService.delete(id);
  }
}
