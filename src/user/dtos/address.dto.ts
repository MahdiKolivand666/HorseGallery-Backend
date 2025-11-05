import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
  @IsOptional()
  receiverName?: string;

  @IsString()
  @IsOptional()
  receiverMobile?: string;

  // Legacy field - kept for backward compatibility
  @IsString()
  @IsOptional()
  content?: string;
}
