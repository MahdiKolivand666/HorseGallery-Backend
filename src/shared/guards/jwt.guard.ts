import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    try {
      const token = request?.headers?.authorization?.split(' ')[1];

      const payload = await this.jwtService.verifyAsync(token);

      request['user'] = {
        _id: payload?._id,
        role: payload?.role,
      };

      return true;
    } catch (error) {
      return false;
    }
  }
}
