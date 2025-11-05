import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { convertNumbers } from '../utils/stringUtils';

@Injectable()
export class PostalCodePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value?.postalCode) {
      // Convert Persian/Farsi numbers to English
      const englishPostalCode = convertNumbers(value.postalCode);

      // Remove any spaces or dashes
      const cleanPostalCode = englishPostalCode.replace(/[\s-]/g, '');

      // Check if it's only digits
      if (!/^\d+$/.test(cleanPostalCode)) {
        throw new BadRequestException('کد پستی باید فقط شامل اعداد باشد');
      }

      // Check length first
      if (cleanPostalCode.length !== 10) {
        throw new BadRequestException(
          `کد پستی باید دقیقاً 10 رقم باشد. تعداد ارقام وارد شده: ${cleanPostalCode.length}`,
        );
      }

      // Check for common invalid patterns (all same digits, sequential, etc.)
      const allSame = /^(\d)\1{9}$/.test(cleanPostalCode);
      const sequential = /^0123456789$|^9876543210$/.test(cleanPostalCode);

      if (allSame) {
        throw new BadRequestException('کد پستی معتبر نیست (همه ارقام یکسان)');
      }

      if (sequential) {
        throw new BadRequestException('کد پستی معتبر نیست (اعداد متوالی)');
      }

      return { ...value, postalCode: cleanPostalCode };
    }
    return value;
  }
}
