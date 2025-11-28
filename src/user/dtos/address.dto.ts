import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class AddressDto {
  @IsString()
  @IsNotEmpty({ message: 'استان الزامی است' })
  province: string;

  @IsString()
  @IsNotEmpty({ message: 'شهر الزامی است' })
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'آدرس الزامی است' })
  address: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsNotEmpty({ message: 'نام گیرنده الزامی است' })
  recipientName: string; // قبلاً receiverName بود

  @IsString()
  @IsNotEmpty({ message: 'موبایل گیرنده الزامی است' })
  recipientMobile: string; // قبلاً receiverMobile بود

  @IsString()
  @IsOptional()
  title?: string; // خانه، محل کار، ...

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  // Legacy fields برای backward compatibility
  @IsString()
  @IsOptional()
  receiverName?: string;

  @IsString()
  @IsOptional()
  receiverMobile?: string;

  @IsString()
  @IsOptional()
  content?: string;
}
