import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { AppService } from 'src/app.service';
import { LogType } from '../schemas/log.schema';

@Catch(HttpException)
export class LogFilter<T extends HttpException> implements ExceptionFilter {
  constructor(private readonly appService: AppService) {}
  async catch(exception: T, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<Request>();

    // فقط logging - response را تغییر نده
    // HttpExceptionFilter بعداً response را handle می‌کند
    try {
      await this.appService.log({
        content: JSON.stringify(exception.getResponse()),
        type: LogType.ERROR,
        url: request.url,
      });
    } catch (logError) {
      // اگر logging fail شد، ignore کن و ادامه بده
      console.error('LogFilter: Failed to log error', logError);
    }

    // Exception را دوباره throw کن تا فیلتر بعدی (HttpExceptionFilter) آن را handle کند
    // در NestJS، اگر exception را throw نکنیم، فیلتر بعدی آن را catch نمی‌کند
    throw exception;
  }
}
