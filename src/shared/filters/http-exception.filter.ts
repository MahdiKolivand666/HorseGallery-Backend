import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppService } from 'src/app.service';
import { LogType } from '../schemas/log.schema';
import { StandardErrorResponse } from '../interfaces/error-response.interface';
import { ExceptionResponse } from '../interfaces/error-response.interface';
import { ErrorCode } from '../constants/error-codes';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(private readonly appService: AppService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'خطای داخلی سرور';
    let errors: Record<string, string[]> | undefined = undefined;

    const additionalFields: Partial<StandardErrorResponse> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        // ✅ استفاده از ExceptionResponse interface برای type safety
        const response = exceptionResponse as ExceptionResponse;

        // ✅ اگر message یک string است، آن را نگه دار
        // ✅ اگر message یک array است، آن را نگه دار
        if (typeof response.message === 'string') {
          message = response.message;
        } else if (Array.isArray(response.message)) {
          message = response.message;
        } else {
          message = exception.message || message;
        }

        errors = response.errors;

        // ✅ کپی کردن فیلدهای اضافی از exceptionResponse
        if (response.code) {
          additionalFields.code = response.code;
        }
        if (response.requiresRegistration !== undefined) {
          additionalFields.requiresRegistration = response.requiresRegistration;
        }
        if (response.isAuthenticated !== undefined) {
          additionalFields.isAuthenticated = response.isAuthenticated;
        }
        if (response.phoneNumber) {
          additionalFields.phoneNumber = response.phoneNumber;
        }
        if (response.requiresOtpVerification !== undefined) {
          additionalFields.requiresOtpVerification =
            response.requiresOtpVerification;
        }
        if (response.remainingAttempts !== undefined) {
          additionalFields.remainingAttempts = response.remainingAttempts;
        }

        // ✅ کپی کردن سایر فیلدهای اضافی
        Object.keys(response).forEach((key) => {
          if (
            !['message', 'code', 'errors'].includes(key) &&
            !additionalFields.hasOwnProperty(key)
          ) {
            additionalFields[key] = response[key];
          }
        });
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
    }

    // ✅ استفاده از StandardErrorResponse interface
    const errorResponse: StandardErrorResponse = {
      statusCode: status,
      message: Array.isArray(message) ? message : [message], // ✅ همیشه array
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      requestId: request['requestId'], // ✅ اضافه کردن requestId
      ...additionalFields, // ✅ فیلدهای اضافی از exceptionResponse
    };

    if (errors) {
      errorResponse.errors = errors;
    }

    // Log the error
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request.method}] ${request.url} - Status: ${status} - Message: ${JSON.stringify(message)}`,
        exception instanceof Error ? exception.stack : '',
      );
    } else if (status >= HttpStatus.BAD_REQUEST) {
      this.logger.warn(
        `[${request.method}] ${request.url} - Status: ${status} - Message: ${JSON.stringify(message)}`,
      );
    }

    // ✅ Logging به database (بدون blocking response)
    // استفاده از fire-and-forget برای جلوگیری از crash
    // ✅ بهبود: logging برای HttpException و Error ها با فیلدهای بیشتر
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      const errorCode =
        typeof exceptionResponse === 'object' &&
        (exceptionResponse as ExceptionResponse).code
          ? (exceptionResponse as ExceptionResponse).code
          : undefined;

      this.appService
        .log({
          content: JSON.stringify(exceptionResponse),
          type: LogType.ERROR,
          url: request.url,
          statusCode: status, // ✅ اضافه کردن statusCode
          method: request.method, // ✅ اضافه کردن method
          requestId: request['requestId'], // ✅ اضافه کردن requestId
          errorCode: errorCode, // ✅ اضافه کردن errorCode
          ipAddress: request.ip || request.socket.remoteAddress, // ✅ اضافه کردن ipAddress
          userAgent: request.get('user-agent'), // ✅ اضافه کردن userAgent
          user: (request as any).user?._id?.toString(), // ✅ اضافه کردن user
        })
        .catch((logError) => {
          // اگر logging fail شد، فقط log کن و crash نکن
          this.logger.error('Failed to log error to database', logError);
        });
    } else if (exception instanceof Error) {
      // ✅ بهبود: logging برای Error ها (نه فقط HttpException)
      this.appService
        .log({
          content: JSON.stringify({
            message: exception.message,
            stack: exception.stack,
            name: exception.name,
          }),
          type: LogType.ERROR,
          url: request.url,
          statusCode: status, // ✅ اضافه کردن statusCode
          method: request.method, // ✅ اضافه کردن method
          requestId: request['requestId'], // ✅ اضافه کردن requestId
          errorCode: ErrorCode.INTERNAL_SERVER_ERROR, // ✅ اضافه کردن errorCode
          ipAddress: request.ip || request.socket.remoteAddress, // ✅ اضافه کردن ipAddress
          userAgent: request.get('user-agent'), // ✅ اضافه کردن userAgent
          user: (request as any).user?._id?.toString(), // ✅ اضافه کردن user
        })
        .catch((logError) => {
          // اگر logging fail شد، فقط log کن و crash نکن
          this.logger.error('Failed to log error to database', logError);
        });
    }

    // ✅ ارسال response (بدون throw کردن exception)
    response.status(status).json(errorResponse);
  }
}
