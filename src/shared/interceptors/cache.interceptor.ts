import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_KEY, CACHE_TTL } from '../decorators/cache.decorator';

// Simple in-memory cache implementation
// For production, replace with Redis
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly cache = new Map<string, { data: any; expiry: number }>();
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(private readonly reflector: Reflector) {
    // Clean expired cache entries every 5 minutes
    setInterval(() => this.cleanExpiredCache(), 5 * 60 * 1000);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const cacheKey = this.reflector.get<string>(
      CACHE_KEY,
      context.getHandler(),
    );
    const cacheTTL = this.reflector.get<number>(
      CACHE_TTL,
      context.getHandler(),
    );

    if (!cacheKey || !cacheTTL) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const fullCacheKey = this.generateCacheKey(cacheKey, request);

    // Check if cached data exists and is not expired
    const cached = this.cache.get(fullCacheKey);
    if (cached && cached.expiry > Date.now()) {
      return of(cached.data);
    }

    // Execute request and cache the response
    return next.handle().pipe(
      tap((data) => {
        this.cache.set(fullCacheKey, {
          data,
          expiry: Date.now() + cacheTTL * 1000,
        });
      }),
    );
  }

  private generateCacheKey(baseKey: string, request: any): string {
    const queryString = JSON.stringify(request.query || {});
    return `${baseKey}:${queryString}`;
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.cache.entries()) {
      if (value.expiry <= now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    // Cleaned expired cache entries
  }

  // Method to manually clear cache
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
      this.logger.log(`Cleared cache entries matching: ${pattern}`);
    } else {
      this.cache.clear();
      this.logger.log('Cleared all cache');
    }
  }
}
