import {
  IsNotEmpty,
  IsString,
  IsOptional,
  Matches,
  MinLength,
  MaxLength,
  ValidateIf,
  IsEmail,
} from 'class-validator';

export class RegisterDto {
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

  @IsString({ message: 'نام باید رشته باشد' })
  @IsNotEmpty({ message: 'نام الزامی است' })
  @MinLength(2, { message: 'نام باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(30, { message: 'نام نمی‌تواند بیشتر از ۳۰ کاراکتر باشد' })
  @Matches(/^[\u0600-\u06FF\s]+$/, {
    message: 'نام باید فقط شامل حروف فارسی باشد',
  })
  firstName: string;

  @IsString({ message: 'نام خانوادگی باید رشته باشد' })
  @IsNotEmpty({ message: 'نام خانوادگی الزامی است' })
  @MinLength(2, { message: 'نام خانوادگی باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(30, { message: 'نام خانوادگی نمی‌تواند بیشتر از ۳۰ کاراکتر باشد' })
  @Matches(/^[\u0600-\u06FF\s]+$/, {
    message: 'نام خانوادگی باید فقط شامل حروف فارسی باشد',
  })
  lastName: string;

  @IsString({ message: 'کد ملی باید رشته باشد' })
  @IsNotEmpty({ message: 'کد ملی الزامی است' })
  @Matches(/^\d{10}$/, {
    message: 'کد ملی باید دقیقاً ۱۰ رقم باشد',
  })
  nationalId: string;

  @IsString({ message: 'ایمیل باید رشته باشد' })
  @IsOptional()
  @MaxLength(100, { message: 'ایمیل نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد' })
  @ValidateIf(
    (o) => o.email !== null && o.email !== undefined && o.email.trim() !== '',
  )
  @Matches(/^[a-zA-Z0-9@._-]+$/, {
    message: 'ایمیل باید به انگلیسی وارد شود',
  })
  @IsEmail({}, { message: 'فرمت ایمیل صحیح نیست' })
  email?: string | null;
}
