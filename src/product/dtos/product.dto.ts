import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsIn,
  Min,
} from 'class-validator';

export class ProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  thumbnail: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsNotEmpty()
  discount: number;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNotEmpty()
  @IsArray()
  images: string[];

  @IsNotEmpty()
  @IsString()
  url: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number; // Weight in grams

  @IsNumber()
  @IsOptional()
  @IsIn([18, 21, 24])
  karat?: number; // Karat (18, 21, 24)

  @IsString()
  @IsOptional()
  @IsIn(['دستبند', 'گردنبند', 'انگشتر', 'گوشواره', 'پابند', 'سایر'])
  type?: string; // Jewelry type

  @IsString()
  @IsOptional()
  @IsIn(['طلای زرد', 'طلای سفید', 'طلای رزگلد'])
  material?: string; // Gold type

  @IsString()
  @IsOptional()
  dimensions?: string; // Dimensions

  @IsBoolean()
  @IsOptional()
  hasCertificate?: boolean; // Has authenticity certificate

  @IsString()
  @IsOptional()
  certificateNumber?: string; // Certificate number
}
