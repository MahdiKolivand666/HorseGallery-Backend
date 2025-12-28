import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { convertNumbers } from '../utils/stringUtils';

/**
 * Pipe برای تبدیل اعداد فارسی به انگلیسی در RegisterDto
 * این Pipe برای phoneNumber, otpCode, nationalId استفاده می‌شود
 */
@Injectable()
export class RegisterNumbersPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const result = { ...value };

    // ✅ تبدیل شماره موبایل
    if (result.phoneNumber) {
      const englishPhone = convertNumbers(result.phoneNumber);
      const cleanPhone = englishPhone.replace(/[\s-]/g, '');

      // بررسی فرمت
      if (!/^09\d{9}$/.test(cleanPhone)) {
        throw new BadRequestException(
          'شماره موبایل باید دقیقاً 11 رقم باشد و با 09 شروع شود',
        );
      }

      result.phoneNumber = cleanPhone;
    }

    // ✅ تبدیل کد OTP
    if (result.otpCode) {
      const englishOtp = convertNumbers(result.otpCode);
      const cleanOtp = englishOtp.replace(/[\s-]/g, '');

      // بررسی فرمت
      if (!/^\d{6}$/.test(cleanOtp)) {
        throw new BadRequestException('کد تأیید باید دقیقاً 6 رقم باشد');
      }

      result.otpCode = cleanOtp;
    }

    // ✅ تبدیل کد ملی
    if (result.nationalId) {
      const englishNationalId = convertNumbers(result.nationalId);
      const cleanNationalId = englishNationalId.replace(/[\s-]/g, '');

      // بررسی فرمت
      if (!/^\d{10}$/.test(cleanNationalId)) {
        throw new BadRequestException('کد ملی باید دقیقاً ۱۰ رقم باشد');
      }

      result.nationalId = cleanNationalId;
    }

    return result;
  }
}
