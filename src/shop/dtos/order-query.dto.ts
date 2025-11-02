import { IsEnum, IsOptional, IsString } from 'class-validator';
import { GeneralQueryDto } from 'src/shared/dtos/general-query.dto';
import { OrderStatus } from '../schemas/order.schema';

export class OrderQueryDto extends GeneralQueryDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  mobile?: string;
}
