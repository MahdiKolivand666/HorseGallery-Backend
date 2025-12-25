import {
  IsNotEmpty,
  IsString,
  IsOptional,
  Matches,
  MinLength,
  MaxLength,
  ValidateIf,
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
  @MinLength(2, { message: 'نام باید حداقل 2 کاراکتر باشد' })
  @MaxLength(50, { message: 'نام نباید بیشتر از 50 کاراکتر باشد' })
  @Matches(/^[\u0600-\u06FF\s]+$/, {
    message: 'نام باید فقط حروف فارسی باشد',
  })
  firstName: string;

  @IsString({ message: 'نام خانوادگی باید رشته باشد' })
  @IsNotEmpty({ message: 'نام خانوادگی الزامی است' })
  @MinLength(2, { message: 'نام خانوادگی باید حداقل 2 کاراکتر باشد' })
  @MaxLength(50, { message: 'نام خانوادگی نباید بیشتر از 50 کاراکتر باشد' })
  @Matches(/^[\u0600-\u06FF\s]+$/, {
    message: 'نام خانوادگی باید فقط حروف فارسی باشد',
  })
  lastName: string;

  @IsString({ message: 'کد ملی باید رشته باشد' })
  @IsNotEmpty({ message: 'کد ملی الزامی است' })
  @Matches(/^\d{10}$/, {
    message: 'کد ملی باید دقیقاً 10 رقم باشد',
  })
  nationalId: string;

  @IsString({ message: 'ایمیل باید رشته باشد' })
  @IsOptional()
  @ValidateIf(
    (o) => o.email !== null && o.email !== undefined && o.email.trim() !== '',
  )
  @Matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'ایمیل باید به انگلیسی وارد شود و فرمت صحیح داشته باشد',
  })
  @MaxLength(100, { message: 'ایمیل نباید بیشتر از 100 کاراکتر باشد' })
  email?: string | null;
}
