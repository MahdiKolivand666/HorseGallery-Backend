import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { convertNumbers } from '../utils/stringUtils';

/**
 * Pipe برای تبدیل اعداد فارسی به انگلیسی در CreateAddressDto
 * این Pipe برای postalCode, nationalId, mobile استفاده می‌شود
 */
@Injectable()
export class AddressNumbersPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value || typeof value !== 'object') {
      return value;
    }

    const result = { ...value };

    // ✅ تبدیل کد پستی
    if (result.postalCode) {
      const englishPostalCode = convertNumbers(result.postalCode);
      const cleanPostalCode = englishPostalCode.replace(/[\s-]/g, '');

      // بررسی فرمت
      if (!/^\d{10}$/.test(cleanPostalCode)) {
        throw new BadRequestException('کد پستی باید دقیقاً ۱۰ رقم باشد');
      }

      result.postalCode = cleanPostalCode;
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

    // ✅ تبدیل شماره موبایل
    if (result.mobile) {
      const englishMobile = convertNumbers(result.mobile);
      const cleanMobile = englishMobile.replace(/[\s-]/g, '');

      // بررسی فرمت
      if (!/^09\d{9}$/.test(cleanMobile)) {
        throw new BadRequestException(
          'شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد',
        );
      }

      result.mobile = cleanMobile;
    }

    return result;
  }
}
