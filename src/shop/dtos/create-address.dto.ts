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

export class CreateAddressDto {
  // بخش آدرس
  @IsString()
  @IsNotEmpty({ message: 'عنوان آدرس الزامی است' })
  @MinLength(1, { message: 'عنوان آدرس باید حداقل 1 کاراکتر باشد' })
  @MaxLength(100, { message: 'عنوان آدرس نمی‌تواند بیشتر از 100 کاراکتر باشد' })
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
  @Matches(/^\d{10}$/, { message: 'کد پستی باید دقیقاً 10 رقم باشد' })
  postalCode: string;

  @IsString()
  @IsNotEmpty({ message: 'آدرس الزامی است' })
  @MinLength(10, { message: 'آدرس باید حداقل 10 کاراکتر باشد' })
  @MaxLength(500, { message: 'آدرس نمی‌تواند بیشتر از 500 کاراکتر باشد' })
  address: string;

  // بخش مشخصات سفارش دهنده
  @IsString()
  @IsNotEmpty({ message: 'نام الزامی است' })
  @MinLength(2, { message: 'نام باید حداقل 2 کاراکتر باشد' })
  @MaxLength(50, { message: 'نام نمی‌تواند بیشتر از 50 کاراکتر باشد' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'نام خانوادگی الزامی است' })
  @MinLength(2, { message: 'نام خانوادگی باید حداقل 2 کاراکتر باشد' })
  @MaxLength(50, { message: 'نام خانوادگی نمی‌تواند بیشتر از 50 کاراکتر باشد' })
  lastName: string;

  @IsString()
  @IsNotEmpty({ message: 'کد ملی الزامی است' })
  @Matches(/^\d{10}$/, { message: 'کد ملی باید دقیقاً 10 رقم باشد' })
  nationalId: string;

  @IsString()
  @IsNotEmpty({ message: 'شماره موبایل الزامی است' })
  @Matches(/^09\d{9}$/, { message: 'فرمت شماره موبایل صحیح نیست' })
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
  @MaxLength(500, { message: 'توضیحات نمی‌تواند بیشتر از 500 کاراکتر باشد' })
  notes?: string | null; // ✅ می‌تواند null باشد

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
