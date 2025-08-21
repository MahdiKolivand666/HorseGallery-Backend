import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LogType } from '../schemas/log.schema';

export class LogDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsEnum(LogType)
  type: LogType;

  @IsOptional()
  @IsString()
  user?: string;

  @IsNotEmpty()
  @IsString()
  url: string;
}
