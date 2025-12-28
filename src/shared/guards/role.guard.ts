import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Role } from 'src/user/schemas/user.schema';

@Injectable()
export class RoleGuard implements CanActivate {
  private readonly logger = new Logger(RoleGuard.name);

  constructor(private readonly roles: Role[]) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();

    const userRole = request?.user?.role;
    const user = request?.user;

    if (!user) {
      this.logger.warn('User not found in request');
      throw new ForbiddenException('User not authenticated');
    }

    if (!userRole) {
      this.logger.warn(`User role not found. User: ${JSON.stringify(user)}`);
      throw new ForbiddenException('User role not found');
    }

    if (this.roles.includes(userRole as Role)) {
      return true;
    } else {
      this.logger.warn(
        `Access denied: ${userRole} is not in allowed roles [${this.roles.join(', ')}]`,
      );
      throw new ForbiddenException(
        `Access denied. Required roles: ${this.roles.join(', ')}. Your role: ${userRole}`,
      );
    }
  }
}
