import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class newCartDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'تعداد باید حداقل 1 باشد' })
  quantity?: number;

  @IsOptional()
  @IsString()
  size?: string; // برای جواهرات (اختیاری)
}
