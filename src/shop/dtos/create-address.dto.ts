import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Matches,
  MinLength,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { MaxLines } from 'src/shared/validators/max-lines.validator';

export class CreateAddressDto {
  // بخش آدرس
  @IsString()
  @IsNotEmpty({ message: 'عنوان آدرس الزامی است' })
  @MinLength(3, { message: 'عنوان آدرس باید حداقل ۳ کاراکتر باشد' })
  @MaxLength(25, { message: 'عنوان آدرس نمی‌تواند بیشتر از ۲۵ کاراکتر باشد' })
  @Matches(/^[\u0600-\u06FF\s،]+$/, {
    message: 'عنوان آدرس باید فقط به فارسی وارد شود',
  })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'استان الزامی است' })
  @MinLength(1, { message: 'استان باید حداقل 1 کاراکتر باشد' })
  @MaxLength(100, { message: 'استان نمی‌تواند بیشتر از 100 کاراکتر باشد' })
  province: string;

  @IsString()
  @IsNotEmpty({ message: 'شهر الزامی است' })
  @MinLength(1, { message: 'شهر باید حداقل 1 کاراکتر باشد' })
  @MaxLength(100, { message: 'شهر نمی‌تواند بیشتر از 100 کاراکتر باشد' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'کد پستی الزامی است' })
  @Matches(/^\d{10}$/, { message: 'کد پستی باید دقیقاً ۱۰ رقم باشد' })
  postalCode: string;

  @IsString()
  @IsNotEmpty({ message: 'آدرس الزامی است' })
  @MinLength(10, { message: 'آدرس باید حداقل ۱۰ کاراکتر باشد' })
  @MaxLength(200, { message: 'آدرس نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد' })
  @Matches(/^[\u0600-\u06FF\u06F0-\u06F9\s،.؛:]+$/, {
    message: 'آدرس باید فقط به فارسی وارد شود',
  })
  @MaxLines(3, { message: 'آدرس نمی‌تواند بیشتر از ۳ خط باشد' })
  address: string;

  // بخش مشخصات سفارش دهنده
  @IsString()
  @IsNotEmpty({ message: 'نام الزامی است' })
  @MinLength(2, { message: 'نام باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(30, { message: 'نام نمی‌تواند بیشتر از ۳۰ کاراکتر باشد' })
  @Matches(/^[\u0600-\u06FF\s]+$/, {
    message: 'نام باید فقط شامل حروف فارسی باشد',
  })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'نام خانوادگی الزامی است' })
  @MinLength(2, { message: 'نام خانوادگی باید حداقل ۲ کاراکتر باشد' })
  @MaxLength(30, { message: 'نام خانوادگی نمی‌تواند بیشتر از ۳۰ کاراکتر باشد' })
  @Matches(/^[\u0600-\u06FF\s]+$/, {
    message: 'نام خانوادگی باید فقط شامل حروف فارسی باشد',
  })
  lastName: string;

  @IsString()
  @IsNotEmpty({ message: 'کد ملی الزامی است' })
  @Matches(/^\d{10}$/, { message: 'کد ملی باید دقیقاً ۱۰ رقم باشد' })
  nationalId: string;

  @IsString()
  @IsNotEmpty({ message: 'شماره موبایل الزامی است' })
  @Matches(/^09\d{9}$/, {
    message: 'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد',
  })
  mobile: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'ایمیل نمی‌تواند بیشتر از 100 کاراکتر باشد' })
  @ValidateIf(
    (o) => o.email !== null && o.email !== undefined && o.email.trim() !== '',
  )
  @Matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'ایمیل باید به انگلیسی وارد شود و فرمت صحیح داشته باشد',
  })
  email?: string | null; // ✅ می‌تواند null باشد - اگر خالی باشد validation skip می‌شود

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'توضیحات نمی‌تواند بیشتر از ۲۰۰ کاراکتر باشد' })
  @ValidateIf(
    (o) => o.notes !== null && o.notes !== undefined && o.notes.trim() !== '',
  )
  @Matches(/^[\u0600-\u06FF\u06F0-\u06F9\s،.؛:]*$/, {
    message: 'توضیحات باید فقط به فارسی وارد شود',
  })
  notes?: string | null; // ✅ می‌تواند null باشد

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
