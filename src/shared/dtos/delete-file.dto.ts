import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteFileDto {
  @ApiProperty({
    description: 'Name of the file to delete',
    example: '2025-01-15T10:30:00.000Z-image.webp',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'Folder where the image is stored',
    example: 'uploads',
  })
  @IsString()
  @IsNotEmpty()
  folder: string;
}
