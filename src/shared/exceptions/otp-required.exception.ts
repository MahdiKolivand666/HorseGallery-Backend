import { ForbiddenException } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes';

/**
 * Exception برای زمانی که کاربر لاگین است اما OTP verify نشده است
 *
 * Frontend باید modal OTP را نمایش دهد.
 */
export class OtpRequiredException extends ForbiddenException {
  constructor(phoneNumber?: string | null) {
    super({
      message: 'لطفاً ابتدا شماره موبایل خود را تأیید کنید',
      code: ErrorCode.OTP_REQUIRED,
      requiresRegistration: true,
      isAuthenticated: true,
      phoneNumber: phoneNumber || null,
      requiresOtpVerification: true,
    });
  }
}
