import { BadRequestException } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes';

/**
 * Exception برای زمانی که کد OTP نامعتبر است
 */
export class OtpInvalidException extends BadRequestException {
  constructor(remainingAttempts?: number) {
    const message = remainingAttempts
      ? `کد تأیید نامعتبر است. ${remainingAttempts} تلاش باقی مانده`
      : 'کد تأیید نامعتبر است';

    super({
      message,
      code: ErrorCode.OTP_INVALID,
      remainingAttempts: remainingAttempts || null,
    });
  }
}
