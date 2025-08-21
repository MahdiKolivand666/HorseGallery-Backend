import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AppService } from 'src/app.service';
import { LogType } from '../schemas/log.schema';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  constructor(private readonly appService: AppService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      tap(async (response) => {
        if (request.method !== 'GET') {
          await this.appService.log({
            content: JSON.stringify(response),
            type: LogType[request.method],
            url: request.url,
            user: request['user']?._id || null,
          });
        }
      }),
    );
  }
}
