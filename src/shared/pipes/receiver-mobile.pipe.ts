import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { convertNumbers } from '../utils/stringUtils';

@Injectable()
export class ReceiverMobilePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Support both old (receiverMobile) and new (recipientMobile) field names
    const mobileField = value?.recipientMobile || value?.receiverMobile;
    
    if (mobileField) {
      // Convert Persian/Farsi numbers to English
      const englishMobile = convertNumbers(mobileField);

      // Remove any spaces or dashes
      const cleanMobile = englishMobile.replace(/[\s-]/g, '');

      // Check if it's only digits
      if (!/^\d+$/.test(cleanMobile)) {
        throw new BadRequestException(
          'شماره موبایل گیرنده باید فقط شامل اعداد باشد',
        );
      }

      // Check if it starts with 09 first
      if (!cleanMobile.startsWith('09')) {
        throw new BadRequestException(
          'شماره موبایل گیرنده باید با 09 شروع شود',
        );
      }

      // Check length after checking 09 prefix
      if (cleanMobile.length !== 11) {
        throw new BadRequestException(
          `شماره موبایل گیرنده باید دقیقاً 11 رقم باشد. تعداد ارقام وارد شده: ${cleanMobile.length}`,
        );
      }

      // Check for common invalid patterns (all same digits, sequential, etc.)
      const allSame = /^(\d)\1{10}$/.test(cleanMobile);
      const sequential = /^01234567890$|^09876543210$/.test(cleanMobile);

      if (allSame) {
        throw new BadRequestException(
          'شماره موبایل گیرنده معتبر نیست (همه ارقام یکسان)',
        );
      }

      if (sequential) {
        throw new BadRequestException(
          'شماره موبایل گیرنده معتبر نیست (اعداد متوالی)',
        );
      }

      // Set both field names for backward compatibility
      return { 
        ...value, 
        recipientMobile: cleanMobile,
        receiverMobile: cleanMobile, // Legacy support
      };
    }
    return value;
  }
}
