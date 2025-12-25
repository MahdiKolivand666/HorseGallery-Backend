import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString({ message: 'شماره موبایل باید رشته باشد' })
  @IsNotEmpty({ message: 'شماره موبایل الزامی است' })
  @Matches(/^09\d{9}$/, {
    message: 'شماره موبایل باید دقیقاً 11 رقم باشد و با 09 شروع شود',
  })
  phoneNumber: string;

  @IsString({ message: 'کد تأیید باید رشته باشد' })
  @IsNotEmpty({ message: 'کد تأیید الزامی است' })
  @Matches(/^\d{6}$/, {
    message: 'کد تأیید باید دقیقاً 6 رقم باشد',
  })
  otpCode: string;
}
