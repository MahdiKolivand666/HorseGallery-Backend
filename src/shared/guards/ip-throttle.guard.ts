import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  CanActivate,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Enhanced Throttle Guard with IP-based and User-based rate limiting
 * Tracks requests per IP address and per authenticated user
 */
@Injectable()
export class IpThrottleGuard implements CanActivate {
  private readonly logger = new Logger(IpThrottleGuard.name);

  // In-memory storage for IP-based rate limiting
  // In production, use Redis for distributed systems
  // Key format: "ip:${ip}:${routeType}" (routeType = 'sensitive' | 'public')
  private ipRequestCounts: Map<string, { count: number; resetTime: number }> =
    new Map();
  private userRequestCounts: Map<string, { count: number; resetTime: number }> =
    new Map();

  // Limits - APIهای عمومی (مثل لیست محصولات، cart، gold-price)
  private readonly PUBLIC_API_LIMIT = 150; // 150 درخواست در دقیقه
  private readonly PUBLIC_API_WINDOW_MS = 60 * 1000; // 1 minute

  // Limits - APIهای حساس (مثل Login، OTP)
  private readonly SENSITIVE_API_LIMIT = 5; // 5 درخواست در 2 دقیقه
  private readonly SENSITIVE_API_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

  // Routes حساس که نیاز به limit سخت‌گیرانه دارند
  private readonly SENSITIVE_ROUTES = [
    '/auth/send-otp',
    '/auth/verify-otp',
    '/auth/sign-in',
    '/auth/sign-up',
    '/auth/confirm',
    '/auth/resend',
    '/auth/register',
  ];

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Get real IP address
    const ip = this.getClientIp(request);

    // Get user ID if authenticated
    const userId = (request as any).user?._id?.toString();

    // Get request path
    const path = request.path;

    // تعیین نوع API (حساس یا عمومی)
    const isSensitiveRoute = this.isSensitiveRoute(path);

    const now = Date.now();

    // Check IP-based limit (با limit مناسب برای نوع route)
    const ipAllowed = this.checkIpLimit(ip, now, isSensitiveRoute, path);
    if (!ipAllowed) {
      this.logger.warn(
        `IP rate limit exceeded for ${ip} on ${path} (${isSensitiveRoute ? 'sensitive' : 'public'})`,
      );
      throw new HttpException(
        {
          message:
            'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check user-based limit (if authenticated) - فقط برای APIهای عمومی
    if (userId && !isSensitiveRoute) {
      const userAllowed = this.checkUserLimit(userId, now);
      if (!userAllowed) {
        this.logger.warn(`User rate limit exceeded for user ${userId}`);
        throw new HttpException(
          {
            message:
              'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید',
            code: 'RATE_LIMIT_EXCEEDED',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      // 1% chance
      this.cleanup(now);
    }

    return true;
  }

  /**
   * بررسی اینکه آیا route حساس است یا نه
   */
  private isSensitiveRoute(path: string): boolean {
    return this.SENSITIVE_ROUTES.some((route) => path.includes(route));
  }

  /**
   * Extract real client IP from request
   */
  private getClientIp(request: Request): string {
    // Check X-Forwarded-For header (from proxies/load balancers)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }

    // Check X-Real-IP header (from nginx)
    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // Fallback to direct connection IP
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  /**
   * Check and update IP-based rate limit
   * @param ip - IP address
   * @param now - Current timestamp
   * @param isSensitiveRoute - Whether this is a sensitive route
   * @param path - Request path (for logging)
   */
  private checkIpLimit(
    ip: string,
    now: number,
    isSensitiveRoute: boolean,
    path: string,
  ): boolean {
    // تعیین limit و window بر اساس نوع route
    const limit = isSensitiveRoute
      ? this.SENSITIVE_API_LIMIT
      : this.PUBLIC_API_LIMIT;
    const windowMs = isSensitiveRoute
      ? this.SENSITIVE_API_WINDOW_MS
      : this.PUBLIC_API_WINDOW_MS;

    // Key برای storage: ترکیب IP و نوع route
    const key = `ip:${ip}:${isSensitiveRoute ? 'sensitive' : 'public'}`;
    const record = this.ipRequestCounts.get(key);

    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      this.ipRequestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    // Increment count
    record.count++;

    // Check if limit exceeded
    if (record.count > limit) {
      return false;
    }

    return true;
  }

  /**
   * Check and update user-based rate limit
   * فقط برای APIهای عمومی استفاده می‌شود
   */
  private checkUserLimit(userId: string, now: number): boolean {
    const limit = this.PUBLIC_API_LIMIT; // استفاده از limit عمومی
    const windowMs = this.PUBLIC_API_WINDOW_MS;

    const record = this.userRequestCounts.get(userId);

    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      this.userRequestCounts.set(userId, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    // Increment count
    record.count++;

    // Check if limit exceeded
    if (record.count > limit) {
      return false;
    }

    return true;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(now: number): void {
    let cleanedIp = 0;
    let cleanedUser = 0;

    // Clean IP records
    for (const [key, value] of this.ipRequestCounts.entries()) {
      if (now > value.resetTime) {
        this.ipRequestCounts.delete(key);
        cleanedIp++;
      }
    }

    // Clean user records
    for (const [key, value] of this.userRequestCounts.entries()) {
      if (now > value.resetTime) {
        this.userRequestCounts.delete(key);
        cleanedUser++;
      }
    }

    // Cleaned expired records
  }
}
