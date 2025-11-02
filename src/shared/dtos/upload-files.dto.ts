import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UploadFilesDto {
  @ApiProperty({
    type: 'array',
    required: false,
    items: { type: 'string', format: 'binary' },
  })
  @IsOptional()
  files?: any[];

  @IsOptional()
  folder?: string;

  @IsOptional()
  height?: number;

  @IsOptional()
  width?: number;
}
