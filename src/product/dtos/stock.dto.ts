import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class StockDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNumber()
  @IsNotEmpty()
  @IsPositive()
  quantity: number;
}
