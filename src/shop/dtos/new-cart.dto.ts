import { IsNotEmpty, IsString } from 'class-validator';

export class newCartDto {
  @IsNotEmpty()
  @IsString()
  product: string;
}
