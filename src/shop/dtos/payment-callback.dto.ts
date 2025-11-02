import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentCallbackDto {
  @ApiPropertyOptional({
    description: 'Payment authority from bank gateway',
    example: 'A000000000000000000000000000000000000',
  })
  @IsString()
  @IsOptional()
  authority?: string;

  @ApiPropertyOptional({
    description: 'Payment status from bank gateway',
    example: 'OK',
  })
  @IsString()
  @IsOptional()
  status?: string;
}
