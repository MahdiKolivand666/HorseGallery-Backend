import { IsNotEmpty, IsString } from 'class-validator';

export class CartItemDto {
  @IsNotEmpty()
  @IsString()
  product: string;

  @IsNotEmpty()
  @IsString()
  cart: string;
}
