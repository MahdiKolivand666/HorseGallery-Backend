import { ForbiddenException } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes';

/**
 * Exception برای زمانی که OTP verification کاربر منقضی شده است
 *
 * Frontend باید token ها را پاک کند و modal OTP را نمایش دهد.
 */
export class OtpVerificationExpiredException extends ForbiddenException {
  constructor(phoneNumber?: string | null) {
    super({
      message: 'کد تأیید منقضی شده است. لطفاً کد جدید دریافت کنید',
      code: ErrorCode.OTP_VERIFICATION_EXPIRED,
      requiresRegistration: true,
      isAuthenticated: false,
      phoneNumber: phoneNumber || null,
    });
  }
}
