import { IsNotEmpty, IsString } from 'class-validator';

export class SignUpDto {
  @IsNotEmpty({ message: 'نام الزامی است' })
  @IsString({ message: 'نام باید رشته باشد' })
  firstName: string;

  @IsNotEmpty({ message: 'نام خانوادگی الزامی است' })
  @IsString({ message: 'نام خانوادگی باید رشته باشد' })
  lastName: string;

  @IsNotEmpty({ message: 'شماره موبایل الزامی است' })
  @IsString({ message: 'شماره موبایل باید رشته باشد' })
  mobile: string;

  @IsNotEmpty({ message: 'رمز عبور الزامی است' })
  @IsString({ message: 'رمز عبور باید رشته باشد' })
  password: string;
}
