import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class AddGoldToCartDto {
  @IsNumber()
  @IsNotEmpty({ message: 'مبلغ الزامی است' })
  @Min(1000000, { message: 'مبلغ باید حداقل 1,000,000 تومان باشد' })
  amount: number; // مبلغ به تومان
}
