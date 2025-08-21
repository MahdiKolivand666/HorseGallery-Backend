import { IsEnum, IsNotEmpty } from 'class-validator';
import { TicketStatus } from '../schemas/ticket.schema';

export class TicketStatusDto {
  @IsEnum(TicketStatus)
  @IsNotEmpty()
  status: TicketStatus;
}
