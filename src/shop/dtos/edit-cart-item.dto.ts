import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class EditCartItemDto {
  @IsNotEmpty()
  @IsString()
  cartItem: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  quantity: number;
}
