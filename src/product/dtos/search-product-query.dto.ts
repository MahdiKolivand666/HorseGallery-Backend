import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchProductQueryDto {
  @IsString()
  @IsNotEmpty({ message: 'پارامتر جستجو الزامی است' })
  q: string; // Search query (required)

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number; // Page number (default: 1)

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number; // Items per page (default: 20)

  @IsOptional()
  @IsString()
  sort?: string; // Sort option: newest, oldest, price-asc, price-desc, popular (default: newest)
}

