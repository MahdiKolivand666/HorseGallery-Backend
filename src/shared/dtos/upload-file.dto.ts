import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UploadFileDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  @IsOptional()
  file?: any;

  @IsString()
  folder?: string;

  @IsOptional()
  height?: number;

  @IsOptional()
  width?: number;
}
