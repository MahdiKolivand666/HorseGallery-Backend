import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { RoleGuard } from 'src/shared/guards/role.guard';
import { Role } from 'src/user/schemas/user.schema';
import { OrderQueryDto } from '../dtos/order-query.dto';
import { UpdateOrderDto } from '../dtos/update-order.dto';

@ApiTags('Order')
@ApiBearerAuth()
@UseGuards(JwtGuard, new RoleGuard([Role.Admin]))
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findAll(@Query() queryParams: OrderQueryDto) {
    return this.orderService.findAll(queryParams);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOneOrderDetails(id);
  }

  @Patch(':id')
  updateStatus(@Param('id') id: string, @Body() body: UpdateOrderDto) {
    return this.orderService.updateOrderStatus(id, body.status);
  }
}
