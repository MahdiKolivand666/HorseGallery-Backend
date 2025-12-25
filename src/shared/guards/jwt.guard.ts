import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenBlacklistService } from '../services/token-blacklist.service';

@Injectable()
export class JwtGuard implements CanActivate {
  private readonly logger = new Logger(JwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.debug('Public route, skipping JWT authentication');
      return true;
    }

    const request = context.switchToHttp().getRequest();

    try {
      // Try both 'authorization' and 'Authorization' headers (case-insensitive)
      const authHeader =
        request?.headers?.authorization || request?.headers?.Authorization;

      if (!authHeader) {
        throw new UnauthorizedException('Authorization header is required');
      }

      // Extract token from "Bearer <token>" format
      // Handle both "Bearer token" and just "token" (Swagger might add Bearer automatically)
      let token: string;
      const trimmedHeader = authHeader.trim();

      if (trimmedHeader.startsWith('Bearer ')) {
        token = trimmedHeader.substring(7).trim(); // Remove "Bearer " prefix
      } else if (trimmedHeader.startsWith('bearer ')) {
        token = trimmedHeader.substring(7).trim(); // Handle lowercase "bearer "
      } else {
        // If no Bearer prefix, assume the whole string is the token
        token = trimmedHeader;
      }

      if (!token || token === 'valid-token' || token === 'Bearer') {
        throw new UnauthorizedException(
          'Invalid token. Please provide a valid JWT token from /auth/confirm endpoint.',
        );
      }

      // Log token for debugging (only first 20 chars for security)
      this.logger.debug(`Verifying token: ${token.substring(0, 20)}...`);
      this.logger.debug(`Token length: ${token.length}`);

      // Validate token format (JWT should have 3 parts separated by dots)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        this.logger.error(
          `Invalid JWT format: Expected 3 parts, got ${tokenParts.length}`,
        );
        throw new UnauthorizedException(
          'Invalid token format. JWT must have 3 parts separated by dots.',
        );
      }

      // Check if JwtService has secret configured
      const jwtServiceOptions = (this.jwtService as any).options;
      this.logger.debug(
        `JwtService secret configured: ${jwtServiceOptions?.secret ? 'Yes' : 'No'}`,
      );
      if (jwtServiceOptions?.secret) {
        this.logger.debug(
          `JwtService secret length: ${jwtServiceOptions.secret.length}`,
        );
      }

      let payload;
      try {
        payload = await this.jwtService.verifyAsync(token);
        this.logger.debug(
          `Token verified successfully. Payload: ${JSON.stringify(payload)}`,
        );
      } catch (verifyError) {
        this.logger.error(
          `JWT verification failed: ${verifyError?.name} - ${verifyError?.message}`,
        );

        // Log more details for debugging
        if (verifyError?.name === 'JsonWebTokenError') {
          this.logger.error(
            `Token signature verification failed. Check JWT_SECRET in .env file.`,
          );
          this.logger.error(
            `JwtService secret available: ${jwtServiceOptions?.secret ? 'Yes' : 'No'}`,
          );
        }

        throw verifyError;
      }

      if (!payload || !payload._id) {
        this.logger.warn(`Invalid token payload: ${JSON.stringify(payload)}`);
        throw new UnauthorizedException('Invalid token payload');
      }

      // ✅ چک کردن blacklist (اگر jti وجود دارد)
      if (payload.jti) {
        const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(
          payload.jti,
        );
        if (isBlacklisted) {
          this.logger.warn(`Token blacklisted: ${payload.jti}`);
          throw new UnauthorizedException('Token has been revoked');
        }
      }

      // Log payload for debugging
      this.logger.debug(`Token payload: ${JSON.stringify(payload)}`);
      this.logger.debug(`Payload role: ${payload?.role}`);

      request['user'] = {
        _id: payload._id,
        role: payload?.role,
      };

      this.logger.debug(`Request user set: ${JSON.stringify(request['user'])}`);

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Handle JWT specific errors
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired. Please login again.');
      }

      if (error?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token format');
      }

      throw new UnauthorizedException(
        `Invalid or expired token: ${error?.message || 'Unknown error'}`,
      );
    }
  }
}
