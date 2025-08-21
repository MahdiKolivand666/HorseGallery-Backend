import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteCartItemDto {
  @IsNotEmpty()
  @IsString()
  cartItem: string;
}
