import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { MongoError } from 'mongodb';
import { Request, Response } from 'express';
import { StandardErrorResponse } from '../interfaces/error-response.interface';
import { ErrorCode } from '../constants/error-codes';

/**
 * Filter to catch MongoDB errors and prevent information leakage
 * Specifically handles MongoDB injection attempts and query errors
 *
 * ✅ بهبود: استفاده از StandardErrorResponse برای هماهنگی با frontend
 */
@Catch(MongoError)
export class MongoExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongoExceptionFilter.name);

  catch(exception: MongoError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Log the actual error for debugging (server-side only)
    this.logger.error(`MongoDB Error: ${exception.message}`, exception.stack);

    // ✅ استفاده از StandardErrorResponse برای هماهنگی با frontend
    // Don't expose MongoDB error details to client
    // This prevents information leakage about database structure
    const errorResponse: StandardErrorResponse = {
      statusCode: HttpStatus.BAD_REQUEST,
      message: ['خطا در پردازش درخواست. لطفاً دوباره تلاش کنید'], // ✅ array
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      code: ErrorCode.INTERNAL_SERVER_ERROR, // ✅ اضافه کردن code
      requestId: request['requestId'], // ✅ اضافه کردن requestId
    };

    response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
  }
}
