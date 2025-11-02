import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { MongoError } from 'mongodb';
import { Response } from 'express';

/**
 * Filter to catch MongoDB errors and prevent information leakage
 * Specifically handles MongoDB injection attempts and query errors
 */
@Catch(MongoError)
export class MongoExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongoExceptionFilter.name);

  catch(exception: MongoError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Log the actual error for debugging (server-side only)
    this.logger.error(`MongoDB Error: ${exception.message}`, exception.stack);

    // Don't expose MongoDB error details to client
    // This prevents information leakage about database structure
    const errorResponse = {
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: new Date().toISOString(),
      message: 'خطا در پردازش درخواست. لطفاً دوباره تلاش کنید',
    };

    response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
  }
}
