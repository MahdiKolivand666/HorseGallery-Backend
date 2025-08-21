import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { AppService } from 'src/app.service';
import { LogType } from '../schemas/log.schema';

@Catch(HttpException)
export class LogFilter<T extends HttpException> implements ExceptionFilter {
  constructor(private readonly appService: AppService) {}
  async catch(exception: T, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const request = host.switchToHttp().getRequest<Request>();
    if (status === 404) {
      response.status(404).send({
        statusCode: status,
        message: 'یافت نشد',
      });
    } else {
      response.send(exception.getResponse());
    }
    await this.appService.log({
      content: JSON.stringify(exception.getResponse()),
      type: LogType.ERROR,
      url: request.url,
    });
  }
}
