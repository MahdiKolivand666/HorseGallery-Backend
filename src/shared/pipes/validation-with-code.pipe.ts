import {
  ValidationPipe,
  BadRequestException,
  ValidationError,
} from '@nestjs/common';
import { ErrorCode } from '../constants/error-codes';

/**
 * Validation Pipe with Error Code
 *
 * این pipe یک ValidationPipe بهبود یافته است که:
 * - Error code را به validation errors اضافه می‌کند
 * - Format یکنواخت برای validation errors ایجاد می‌کند
 * - با StandardErrorResponse هماهنگ است
 */
export class ValidationWithCodePipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        // ✅ Format کردن validation errors
        const formattedErrors: Record<string, string[]> = {};
        validationErrors.forEach((error) => {
          formattedErrors[error.property] = Object.values(
            error.constraints || {},
          );
        });

        // ✅ ایجاد exception با error code
        return new BadRequestException({
          message: 'خطاهای اعتبارسنجی',
          code: ErrorCode.VALIDATION_ERROR,
          errors: formattedErrors,
        });
      },
    });
  }
}
