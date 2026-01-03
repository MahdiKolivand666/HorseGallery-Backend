import { ErrorCode } from '../constants/error-codes';

/**
 * Standard Error Response Interface
 *
 * این interface ساختار استاندارد response خطا را تعریف می‌کند.
 * همه فیلترهای exception باید از این interface استفاده کنند
 * تا با frontend هماهنگ باشند.
 *
 * Frontend انتظار دارد که:
 * - message همیشه array باشد (string[])
 * - code برای شناسایی نوع خطا وجود داشته باشد
 * - requestId برای tracking وجود داشته باشد (اختیاری)
 */
export interface StandardErrorResponse {
  /**
   * HTTP status code
   */
  statusCode: number;

  /**
   * پیام‌های خطا - همیشه به صورت array
   * Frontend انتظار دارد message همیشه array باشد
   */
  message: string[];

  /**
   * زمان خطا (ISO format)
   */
  timestamp: string;

  /**
   * مسیر درخواست
   */
  path: string;

  /**
   * متد HTTP (GET, POST, etc.)
   */
  method: string;

  /**
   * Error code برای شناسایی نوع خطا
   * Frontend از این code برای تصمیم‌گیری استفاده می‌کند
   */
  code?: ErrorCode;

  /**
   * Request ID برای tracking خطاها
   * این ID در header X-Request-ID نیز ارسال می‌شود
   */
  requestId?: string;

  /**
   * Validation errors - برای خطاهای validation
   * هر فیلد می‌تواند یک یا چند پیام خطا داشته باشد
   */
  errors?: {
    [field: string]: string[];
  };

  /**
   * فیلدهای خاص برای Registration Errors
   */
  requiresRegistration?: boolean;
  isAuthenticated?: boolean;
  phoneNumber?: string | null;
  requiresOtpVerification?: boolean;

  /**
   * فیلدهای خاص برای OTP Errors
   */
  remainingAttempts?: number | null;

  /**
   * فیلدهای اضافی برای سایر error types
   */
  [key: string]: any;
}

/**
 * Exception Response Interface
 *
 * این interface ساختار response exception را تعریف می‌کند.
 * برای استفاده در exception classes
 */
export interface ExceptionResponse {
  message: string | string[];
  code?: ErrorCode;
  errors?: {
    [field: string]: string[];
  };
  [key: string]: any;
}
