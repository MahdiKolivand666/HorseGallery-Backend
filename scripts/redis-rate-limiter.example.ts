/**
 * Redis-based Rate Limiter Example
 *
 * This is an example implementation using Redis for distributed rate limiting.
 * For production with multiple servers, replace in-memory rate limiting with Redis.
 *
 * Installation:
 *   npm install ioredis @nestjs/throttler
 *
 * Usage:
 *   1. Copy this file to src/shared/guards/redis-throttle.guard.ts
 *   2. Update app.module.ts to use RedisThrottleGuard instead of IpThrottleGuard
 *   3. Configure Redis connection in .env
 */

import {
  Injectable,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  CanActivate,
} from '@nestjs/common';
import { Request } from 'express';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisThrottleGuard implements CanActivate {
  private readonly logger = new Logger(RedisThrottleGuard.name);
  private readonly redis: Redis;

  // Limits
  private readonly IP_LIMIT = 100; // requests per window
  private readonly USER_LIMIT = 200; // requests per window (higher for authenticated users)
  private readonly WINDOW_SECONDS = 60; // 1 minute window

  constructor(private readonly configService: ConfigService) {
    // Initialize Redis connection
    const redisUrl =
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected for rate limiting');
    });

    this.redis.on('error', (error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Get real IP address
    const ip = this.getClientIp(request);

    // Get user ID if authenticated
    const userId = (request as any).user?._id?.toString();

    try {
      // Check IP-based limit
      const ipAllowed = await this.checkRateLimit(`ip:${ip}`, this.IP_LIMIT);

      if (!ipAllowed) {
        this.logger.warn(`IP rate limit exceeded for ${ip}`);
        throw new HttpException(
          'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Check user-based limit (if authenticated)
      if (userId) {
        const userAllowed = await this.checkRateLimit(
          `user:${userId}`,
          this.USER_LIMIT,
        );

        if (!userAllowed) {
          this.logger.warn(`User rate limit exceeded for user ${userId}`);
          throw new HttpException(
            'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً کمی صبر کنید',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // Redis error - log but allow request (fail open)
      this.logger.error(`Rate limiting error: ${(error as Error).message}`);
      return true;
    }
  }

  /**
   * Check rate limit using Redis
   */
  private async checkRateLimit(key: string, limit: number): Promise<boolean> {
    const redisKey = `ratelimit:${key}`;

    // Increment counter
    const current = await this.redis.incr(redisKey);

    // Set expiry on first request
    if (current === 1) {
      await this.redis.expire(redisKey, this.WINDOW_SECONDS);
    }

    // Check if limit exceeded
    return current <= limit;
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
   * Clean up Redis connection on application shutdown
   */
  async onModuleDestroy() {
    await this.redis.quit();
    this.logger.log('Redis connection closed');
  }
}

/**
 * Environment Variables needed:
 *
 * REDIS_URL=redis://localhost:6379
 * REDIS_PASSWORD=your-redis-password (optional)
 *
 * For production with Redis Cluster:
 * REDIS_CLUSTER_NODES=host1:6379,host2:6379,host3:6379
 */

/**
 * How to use in app.module.ts:
 *
 * import { RedisThrottleGuard } from './shared/guards/redis-throttle.guard';
 *
 * providers: [
 *   {
 *     provide: APP_GUARD,
 *     useClass: RedisThrottleGuard,
 *   },
 * ]
 */
