import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Optional JWT Guard - JWT را اختیاری می‌کند
 * اگر JWT وجود داشت، user را set می‌کند
 * اگر وجود نداشت، user را null می‌گذارد و ادامه می‌دهد
 */
@Injectable()
export class OptionalJwtGuard implements CanActivate {
  private readonly logger = new Logger(OptionalJwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
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
        // اگر header وجود نداشت، user را null می‌گذاریم و ادامه می‌دهیم
        this.logger.debug('No authorization header, setting user to null');
        request['user'] = null;
        return true;
      }

      // Extract token from "Bearer <token>" format
      let token: string;
      const trimmedHeader = authHeader.trim();

      if (trimmedHeader.startsWith('Bearer ')) {
        token = trimmedHeader.substring(7).trim();
      } else if (trimmedHeader.startsWith('bearer ')) {
        token = trimmedHeader.substring(7).trim();
      } else {
        token = trimmedHeader;
      }

      if (!token || token === 'valid-token' || token === 'Bearer') {
        this.logger.debug('Invalid token format, setting user to null');
        request['user'] = null;
        return true;
      }

      // Validate token format
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        this.logger.debug('Invalid JWT format, setting user to null');
        request['user'] = null;
        return true;
      }

      // Try to verify token
      try {
        const payload = await this.jwtService.verifyAsync(token);

        if (payload && payload._id) {
          request['user'] = {
            _id: payload._id,
            role: payload?.role,
          };
          this.logger.debug(`User authenticated: ${payload._id}`);
        } else {
          request['user'] = null;
        }
      } catch (verifyError) {
        // اگر token معتبر نبود، user را null می‌گذاریم و ادامه می‌دهیم
        this.logger.debug(
          `Token verification failed, setting user to null: ${verifyError.message}`,
        );
        request['user'] = null;
      }

      return true;
    } catch (error) {
      // در صورت هر خطایی، user را null می‌گذاریم و ادامه می‌دهیم
      this.logger.debug(
        `Error in OptionalJwtGuard, setting user to null: ${error.message}`,
      );
      request['user'] = null;
      return true;
    }
  }
}
