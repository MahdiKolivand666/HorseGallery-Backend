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
    let errors: any = undefined;

    const additionalFields: any = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        // ✅ اگر message یک string است، آن را نگه دار
        // ✅ اگر message یک array است، آن را نگه دار
        const responseMessage = (exceptionResponse as any).message;
        if (typeof responseMessage === 'string') {
          message = responseMessage;
        } else if (Array.isArray(responseMessage)) {
          message = responseMessage;
        } else {
          message = exception.message || message;
        }
        errors = (exceptionResponse as any).errors;

        // ✅ اگر response object دارای فیلدهای اضافی باشد، آن‌ها را ذخیره کن
        // برای مواردی مثل INCOMPLETE_REGISTRATION که نیاز به اطلاعات اضافی دارد
        if ((exceptionResponse as any).code) {
          additionalFields.code = (exceptionResponse as any).code;
        }
        if ((exceptionResponse as any).requiresRegistration !== undefined) {
          additionalFields.requiresRegistration = (
            exceptionResponse as any
          ).requiresRegistration;
        }
        if ((exceptionResponse as any).isAuthenticated !== undefined) {
          additionalFields.isAuthenticated = (
            exceptionResponse as any
          ).isAuthenticated;
        }
        if ((exceptionResponse as any).phoneNumber) {
          additionalFields.phoneNumber = (exceptionResponse as any).phoneNumber;
        }
        if ((exceptionResponse as any).requiresOtpVerification !== undefined) {
          additionalFields.requiresOtpVerification = (
            exceptionResponse as any
          ).requiresOtpVerification;
        }
        // ✅ اضافه کردن remainingAttempts برای OTP_INVALID errors
        if ((exceptionResponse as any).remainingAttempts !== undefined) {
          additionalFields.remainingAttempts = (
            exceptionResponse as any
          ).remainingAttempts;
        }
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

    // Standardized error response
    const errorResponse: any = {
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
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
    if (exception instanceof HttpException) {
      this.appService
        .log({
          content: JSON.stringify(exception.getResponse()),
          type: LogType.ERROR,
          url: request.url,
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
