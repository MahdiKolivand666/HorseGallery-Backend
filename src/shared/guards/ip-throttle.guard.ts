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
  private ipRequestCounts: Map<string, { count: number; resetTime: number }> =
    new Map();
  private userRequestCounts: Map<string, { count: number; resetTime: number }> =
    new Map();

  // Limits
  private readonly IP_LIMIT = 100; // requests per window
  private readonly USER_LIMIT = 200; // requests per window (higher for authenticated users)
  private readonly WINDOW_MS = 60 * 1000; // 1 minute

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Get real IP address
    const ip = this.getClientIp(request);

    // Get user ID if authenticated
    const userId = (request as any).user?._id?.toString();

    const now = Date.now();

    // Check IP-based limit
    const ipAllowed = this.checkIpLimit(ip, now);
    if (!ipAllowed) {
      this.logger.warn(`IP rate limit exceeded for ${ip}`);
      throw new HttpException(
        'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Check user-based limit (if authenticated)
    if (userId) {
      const userAllowed = this.checkUserLimit(userId, now);
      if (!userAllowed) {
        this.logger.warn(`User rate limit exceeded for user ${userId}`);
        throw new HttpException(
          'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید',
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
   */
  private checkIpLimit(ip: string, now: number): boolean {
    const record = this.ipRequestCounts.get(ip);

    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      this.ipRequestCounts.set(ip, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      });
      return true;
    }

    // Increment count
    record.count++;

    // Check if limit exceeded
    if (record.count > this.IP_LIMIT) {
      return false;
    }

    return true;
  }

  /**
   * Check and update user-based rate limit
   */
  private checkUserLimit(userId: string, now: number): boolean {
    const record = this.userRequestCounts.get(userId);

    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      this.userRequestCounts.set(userId, {
        count: 1,
        resetTime: now + this.WINDOW_MS,
      });
      return true;
    }

    // Increment count
    record.count++;

    // Check if limit exceeded
    if (record.count > this.USER_LIMIT) {
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

    if (cleanedIp > 0 || cleanedUser > 0) {
      this.logger.debug(
        `Cleaned up ${cleanedIp} IP records and ${cleanedUser} user records`,
      );
    }
  }
}
