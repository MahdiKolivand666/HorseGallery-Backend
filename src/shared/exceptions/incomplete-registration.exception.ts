import { ForbiddenException } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes';

/**
 * Exception برای زمانی که کاربر لاگین است اما اطلاعات تکمیلی را کامل نکرده است
 *
 * Frontend باید modal تکمیل اطلاعات را نمایش دهد.
 */
export class IncompleteRegistrationException extends ForbiddenException {
  constructor(phoneNumber?: string | null) {
    super({
      message: 'لطفاً ابتدا اطلاعات تکمیلی خود را کامل کنید',
      code: ErrorCode.INCOMPLETE_REGISTRATION,
      requiresRegistration: true,
      isAuthenticated: true,
      phoneNumber: phoneNumber || null,
    });
  }
}
