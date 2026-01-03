import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Request ID Middleware
 *
 * این middleware یک unique request ID برای هر request ایجاد می‌کند.
 * این ID برای tracking خطاها و debugging استفاده می‌شود.
 *
 * Request ID در:
 * - req['requestId']: برای استفاده در filters و controllers
 * - X-Request-ID header: برای frontend
 * ذخیره می‌شود.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // ایجاد unique request ID
    const requestId = randomUUID();

    // ذخیره در request object
    req['requestId'] = requestId;

    // ارسال در response header برای frontend
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}
