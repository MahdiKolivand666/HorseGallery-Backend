import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { MongoError } from 'mongodb';
import { Request, Response } from 'express';
import { StandardErrorResponse } from '../interfaces/error-response.interface';
import { ErrorCode } from '../constants/error-codes';

/**
 * Duplicate Filter
 *
 * این فیلتر خطاهای duplicate key در MongoDB را مدیریت می‌کند.
 *
 * ✅ بهبود: استفاده از StandardErrorResponse برای هماهنگی با frontend
 */
@Catch(MongoError)
export class DuplicateFilter implements ExceptionFilter {
  catch(exception: MongoError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception.code === 11000) {
      const duplicateField = exception['keyValue']
        ? Object.keys(exception['keyValue'])[0]
        : 'unknown';

      // ✅ استفاده از StandardErrorResponse برای هماهنگی با frontend
      const errorResponse: StandardErrorResponse = {
        statusCode: HttpStatus.CONFLICT,
        message: [`${duplicateField} آیتم تکراری`], // ✅ array
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        code: ErrorCode.DUPLICATE_ENTRY, // ✅ اضافه کردن code
        requestId: request['requestId'], // ✅ اضافه کردن requestId
      };

      response.status(HttpStatus.CONFLICT).json(errorResponse);
    }
  }
}
