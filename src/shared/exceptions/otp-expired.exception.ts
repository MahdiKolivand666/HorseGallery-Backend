import { BadRequestException } from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes';

/**
 * Exception برای زمانی که کد OTP منقضی شده است
 */
export class OtpExpiredException extends BadRequestException {
  constructor() {
    super({
      message: 'کد تأیید منقضی شده است. لطفاً کد جدید دریافت کنید',
      code: ErrorCode.OTP_EXPIRED,
    });
  }
}
