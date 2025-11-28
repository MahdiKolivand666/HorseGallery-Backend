import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';

export class ProductDto {
  @IsString()
  @IsNotEmpty()
  name: string; // قبلاً title بود

  @IsString()
  @IsNotEmpty()
  slug: string; // قبلاً url بود

  @IsString()
  @IsNotEmpty()
  code: string; // کد محصول مثل GN-001-18K

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0, { message: 'قیمت نمی‌تواند منفی باشد' })
  price: number;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'قیمت تخفیف نمی‌تواند منفی باشد' })
  discountPrice?: number | null; // قبلاً discount بود

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsString()
  @IsNotEmpty()
  category: string; // ObjectId as string

  @IsString()
  @IsOptional()
  subcategory?: string; // ObjectId as string

  @IsString()
  @IsOptional()
  weight?: string; // مثال: "12.5 گرم"

  @IsString()
  @IsOptional()
  karat?: string; // مثال: "18 عیار"

  @IsString()
  @IsOptional()
  material?: string; // مثال: "طلای سرخ"

  @IsString()
  @IsOptional()
  dimensions?: string;

  @IsString()
  @IsOptional()
  brand?: string;

  @IsString()
  @IsOptional()
  coverage?: string; // نوع پوشش

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  isBestSelling?: boolean;

  @IsBoolean()
  @IsOptional()
  isNewArrival?: boolean;

  @IsBoolean()
  @IsOptional()
  isGift?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  rating?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  reviewsCount?: number;
}
