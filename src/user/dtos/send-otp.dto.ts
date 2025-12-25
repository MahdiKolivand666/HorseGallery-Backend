import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @IsString({ message: 'شماره موبایل باید رشته باشد' })
  @IsNotEmpty({ message: 'شماره موبایل الزامی است' })
  @Matches(/^09\d{9}$/, {
    message: 'شماره موبایل باید دقیقاً 11 رقم باشد و با 09 شروع شود',
  })
  phoneNumber: string;
}
