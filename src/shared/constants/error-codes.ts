/**
 * Error Codes Enum
 *
 * این enum شامل تمام error codes استاندارد پروژه است.
 * Frontend می‌تواند بر اساس این codes تصمیم‌گیری کند.
 */
export enum ErrorCode {
  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Authentication Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',

  // Registration Errors
  INCOMPLETE_REGISTRATION = 'INCOMPLETE_REGISTRATION',
  OTP_REQUIRED = 'OTP_REQUIRED',
  OTP_VERIFICATION_EXPIRED = 'OTP_VERIFICATION_EXPIRED',
  OTP_EXPIRED = 'OTP_EXPIRED',
  OTP_INVALID = 'OTP_INVALID',

  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}
