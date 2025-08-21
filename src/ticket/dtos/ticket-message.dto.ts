import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class TicketMessageDto {
  @IsNotEmpty()
  @IsString()
  ticket: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
