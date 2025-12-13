import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CartItemDto {
  @IsNotEmpty()
  @IsString()
  product: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'تعداد باید حداقل 1 باشد' })
  quantity?: number;

  @IsNotEmpty()
  @IsString()
  cart: string;

  @IsOptional()
  @IsString()
  size?: string; // برای جواهرات (اختیاری)

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'قیمت نمی‌تواند منفی باشد' })
  price?: number; // قیمت در زمان افزودن
}
