import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PublicProductQueryDto {
  // Pagination & Sorting
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string; // newest, price-asc, price-desc, popular

  // Category & Subcategory
  @IsOptional()
  @IsString()
  category?: string; // slug of category

  @IsOptional()
  @IsString()
  subcategory?: string; // slug of subcategory

  // Product Type (jewelry, coin, melted_gold)
  @IsOptional()
  @IsString()
  productType?: string;

  // Price Range
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  // Array Filters (will be received as multiple params with same name)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  colors?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  karats?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  brands?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  branches?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  wages?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  coatings?: string[];

  // Weight Range
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minWeight?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxWeight?: number;

  // Stock & Sale Filters
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  inStock?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  onSale?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  lowCommission?: boolean;

  // Feature Filters
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isBestSelling?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isNewArrival?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isGift?: boolean;
}
