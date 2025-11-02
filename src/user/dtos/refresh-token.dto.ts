import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token برای دریافت access token جدید',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({ message: 'توکن باید رشته باشد' })
  @IsNotEmpty({ message: 'توکن الزامی است' })
  refreshToken: string;
}
