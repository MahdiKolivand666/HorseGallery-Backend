import { IsOptional, IsString, IsEnum } from 'class-validator';
import { GeneralQueryDto } from 'src/shared/dtos/general-query.dto';
import { TicketStatus } from '../schemas/ticket.schema';

export class TicketQueryDto extends GeneralQueryDto {
  @IsOptional()
  @IsString()
  status?: TicketStatus;

  @IsOptional()
  @IsString()
  user?: string;
}
