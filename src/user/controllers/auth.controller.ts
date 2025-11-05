import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthDto } from '../dtos/auth.dto';
import { MobilePipe } from 'src/shared/pipes/mobile.pipe';
import { PasswordPipe } from 'src/shared/pipes/password.pipe';
import { UserService } from '../services/user.service';
import { ConfirmDto } from '../dtos/confirm.dto';
import { ResendDto } from '../dtos/resend.dto';
import { SignUpDto } from '../dtos/signup.dto';
import { FarsiPipe } from 'src/shared/pipes/farsi.pipe';
import { Role } from '../schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { CsrfGuard, CsrfExempt } from 'src/shared/guards/csrf.guard';
import { User } from 'src/shared/decorators/user.decorator';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import type { Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(CsrfGuard)
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Post('sign-in')
  @CsrfExempt()
  signIn(
    @Body(MobilePipe, new PasswordPipe(false)) body: AuthDto,
    @Req() req: Request,
  ) {
    return this.userService.signin(body, req);
  }

  @Post('confirm')
  confirmCode(@Body(MobilePipe) body: ConfirmDto, @Req() req: Request) {
    return this.userService.confirm(body, req);
  }

  @Post('resend')
  @CsrfExempt()
  resendCode(@Body(MobilePipe) body: ResendDto) {
    return this.userService.sendCode(body.mobile);
  }

  @Post('sign-up')
  @CsrfExempt()
  async signup(
    @Body(FarsiPipe, MobilePipe, new PasswordPipe(true)) body: SignUpDto,
  ) {
    const user = await this.userService.create({
      ...body,
      role: Role.User,
    });

    if (user?._id) {
      return this.userService.sendCode(user.mobile);
    }
  }

  @Get('dev-code')
  @CsrfExempt()
  async getDevCode(@Query('mobile') mobile: string) {
    const isDevelopment = this.configService.get('NODE_ENV') !== 'production';
    if (!isDevelopment) {
      return {
        error: 'This endpoint is only available in development mode',
      };
    }

    return this.userService.getVerificationCode(mobile);
  }

  @Post('dev-reset-rate-limit')
  @CsrfExempt()
  async resetRateLimit(@Body('mobile') mobile: string) {
    const isDevelopment = this.configService.get('NODE_ENV') !== 'production';
    if (!isDevelopment) {
      return {
        error: 'This endpoint is only available in development mode',
      };
    }

    return this.userService.resetRateLimit(mobile);
  }

  @Post('refresh-token')
  refreshToken(@Body() body: RefreshTokenDto) {
    return this.userService.refreshAccessToken(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  logout(@User() userId: string) {
    return this.userService.logout(userId);
  }
}
