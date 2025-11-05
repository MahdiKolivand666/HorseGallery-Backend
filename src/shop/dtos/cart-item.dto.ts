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
}
