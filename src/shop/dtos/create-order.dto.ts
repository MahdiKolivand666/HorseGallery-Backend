import { IsMongoId, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  cartId: string;

  @IsNotEmpty()
  @IsMongoId()
  shippingId: string;

  @IsNotEmpty()
  @IsString()
  addressId: string;
}
