import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * CSRF Guard using Double Submit Cookie pattern
 * More modern and secure than deprecated csurf package
 *
 * NOTE: Disabled in development mode for easier Swagger testing
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name);

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Skip CSRF check in development mode for easier Swagger testing
    const isDevelopment = this.configService.get('NODE_ENV') !== 'production';
    if (isDevelopment) {
      return true;
    }

    // Check if route is marked as CSRF exempt
    const isPublic = this.reflector.get<boolean>(
      'csrf_exempt',
      context.getHandler(),
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    // CSRF protection only for state-changing methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return true;
    }

    // Get CSRF token from header
    const csrfTokenFromHeader =
      request.headers['x-csrf-token'] || request.headers['x-xsrf-token'];

    // Get CSRF token from cookie
    const csrfTokenFromCookie =
      request.cookies?.['XSRF-TOKEN'] || request.cookies?.['csrf-token'];

    // Validate tokens
    if (!csrfTokenFromHeader || !csrfTokenFromCookie) {
      this.logger.warn(
        `CSRF token missing for ${method} ${request.url} from ${request.ip}`,
      );
      throw new ForbiddenException('توکن امنیتی یافت نشد');
    }

    if (csrfTokenFromHeader !== csrfTokenFromCookie) {
      this.logger.warn(
        `CSRF token mismatch for ${method} ${request.url} from ${request.ip}`,
      );
      throw new ForbiddenException('توکن امنیتی نامعتبر است');
    }

    return true;
  }
}

/**
 * Decorator to mark routes as CSRF exempt
 * Use only for public endpoints that don't require CSRF protection
 */
export const CsrfExempt = () => Reflect.metadata('csrf_exempt', true);
