import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '../schemas/order.schema';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderDto {
  @ApiProperty({
    description: 'Order status',
    enum: OrderStatus,
    example: OrderStatus.Sent,
  })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}
