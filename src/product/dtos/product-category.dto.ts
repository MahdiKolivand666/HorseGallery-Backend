import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SubcategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;
}

export class ProductCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string; // قبلاً title بود

  @IsString()
  @IsNotEmpty()
  slug: string; // قبلاً url بود

  @IsString()
  @IsNotEmpty()
  heroImage: string; // قبلاً image بود

  @IsString()
  @IsOptional()
  content?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubcategoryDto)
  @IsOptional()
  subcategories?: SubcategoryDto[];

  // Legacy fields برای backward compatibility
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  image?: string;
}
