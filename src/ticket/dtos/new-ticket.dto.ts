import { IsNotEmpty, IsString } from 'class-validator';

export class NewTicketDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content?: string;

  @IsNotEmpty()
  @IsString()
  image?: string;
}
