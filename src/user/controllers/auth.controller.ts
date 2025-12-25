import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthDto } from '../dtos/auth.dto';
import { MobilePipe } from 'src/shared/pipes/mobile.pipe';
import { PasswordPipe } from 'src/shared/pipes/password.pipe';
import { UserService } from '../services/user.service';
import { ConfirmDto } from '../dtos/confirm.dto';
import { ResendDto } from '../dtos/resend.dto';
import { SignUpDto } from '../dtos/signup.dto';
import { SendOtpDto } from '../dtos/send-otp.dto';
import { VerifyOtpDto } from '../dtos/verify-otp.dto';
import { RegisterDto } from '../dtos/register.dto';
import { FarsiPipe } from 'src/shared/pipes/farsi.pipe';
import { RegisterNumbersPipe } from 'src/shared/pipes/register-numbers.pipe';
import { Role } from '../schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { CsrfGuard, CsrfExempt } from 'src/shared/guards/csrf.guard';
import { User } from 'src/shared/decorators/user.decorator';
import { RefreshTokenDto } from '../dtos/refresh-token.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Refresh Access Token' })
  @ApiResponse({
    status: 200,
    description: 'Token با موفقیت refresh شد',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Token با موفقیت refresh شد' },
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Refresh token نامعتبر یا منقضی شده',
  })
  refreshToken(@Body() body: RefreshTokenDto) {
    return this.userService.refreshAccessToken(body.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  logout(@User() userId: string, @Req() req: Request) {
    // ✅ استخراج token از header
    const authHeader =
      req?.headers?.authorization || req?.headers?.Authorization;
    let token: string | undefined;
    if (authHeader) {
      const authHeaderStr = Array.isArray(authHeader)
        ? authHeader[0]
        : authHeader;
      const trimmedHeader = authHeaderStr.trim();
      if (trimmedHeader.startsWith('Bearer ')) {
        token = trimmedHeader.substring(7).trim();
      } else if (trimmedHeader.startsWith('bearer ')) {
        token = trimmedHeader.substring(7).trim();
      } else {
        token = trimmedHeader;
      }
    }
    return this.userService.logout(userId, token);
  }

  @Post('send-otp')
  @CsrfExempt()
  @ApiOperation({
    summary: 'ارسال کد OTP به شماره موبایل',
    description:
      'این endpoint کد OTP 6 رقمی را به شماره موبایل ارسال می‌کند. برای کاربران جدید و موجود کار می‌کند.',
  })
  @ApiResponse({
    status: 200,
    description: 'کد OTP با موفقیت ارسال شد',
  })
  @ApiResponse({
    status: 400,
    description: 'شماره موبایل نامعتبر یا rate limit',
  })
  @ApiResponse({
    status: 429,
    description: 'درخواست‌های زیادی ارسال شده است',
  })
  async sendOtp(@Body() body: SendOtpDto, @Req() req: Request) {
    return await this.userService.sendOtp(body, req);
  }

  @Post('verify-otp')
  @CsrfExempt()
  // ✅ Rate limiting: 5 بار در 15 دقیقه (از IpThrottleGuard استفاده می‌شود)
  @ApiOperation({
    summary: 'تأیید کد OTP و دریافت Token',
    description:
      'این endpoint کد OTP را تأیید می‌کند و JWT token برمی‌گرداند. اگر کاربر جدید باشد، کاربر جدید ایجاد می‌شود.',
  })
  @ApiResponse({
    status: 200,
    description: 'کد OTP تأیید شد و token برگردانده شد',
  })
  @ApiResponse({
    status: 400,
    description: 'کد OTP نامعتبر است',
  })
  @ApiResponse({
    status: 410,
    description: 'کد OTP منقضی شده است',
  })
  async verifyOtp(@Body() body: VerifyOtpDto, @Req() req: Request) {
    return await this.userService.verifyOtp(body, req);
  }

  @Post('register')
  @CsrfExempt()
  // ✅ Rate limiting: 3 بار در 15 دقیقه (از IpThrottleGuard استفاده می‌شود)
  @ApiOperation({
    summary: 'ثبت‌نام کاربر با اطلاعات تکمیلی',
    description:
      'این endpoint کاربر را با اطلاعات تکمیلی (نام، نام خانوادگی، کد ملی، ایمیل) ثبت‌نام می‌کند. ابتدا باید کد OTP دریافت شده باشد.',
  })
  @ApiResponse({
    status: 200,
    description: 'ثبت‌نام با موفقیت انجام شد',
  })
  @ApiResponse({
    status: 400,
    description: 'کد OTP نامعتبر یا validation error',
  })
  @ApiResponse({
    status: 409,
    description: 'کاربر یا کد ملی قبلاً ثبت شده است',
  })
  async register(
    @Body(new RegisterNumbersPipe(), new FarsiPipe())
    body: RegisterDto,
    @Req() req: Request,
  ) {
    return await this.userService.register(body, req);
  }

  @Get('otp/remaining-time')
  @CsrfExempt()
  @ApiOperation({
    summary: 'دریافت زمان باقی‌مانده کد OTP',
    description:
      'این endpoint زمان باقی‌مانده کد OTP را برای شماره موبایل مشخص شده برمی‌گرداند.',
  })
  @ApiResponse({
    status: 200,
    description: 'زمان باقی‌مانده با موفقیت برگردانده شد',
  })
  @ApiResponse({
    status: 400,
    description: 'شماره موبایل نامعتبر است',
  })
  @ApiResponse({
    status: 404,
    description: 'کد تأیید یافت نشد',
  })
  async getOtpRemainingTime(@Query('phoneNumber') phoneNumber: string) {
    if (!phoneNumber) {
      throw new BadRequestException('شماره موبایل الزامی است');
    }
    return await this.userService.getOtpRemainingTime(phoneNumber);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'دریافت اطلاعات کاربر فعلی',
    description:
      'این endpoint اطلاعات کاربر فعلی را برمی‌گرداند. کاربر باید login کرده باشد.',
  })
  @ApiResponse({
    status: 200,
    description: 'اطلاعات کاربر با موفقیت برگردانده شد',
  })
  @ApiResponse({
    status: 401,
    description: 'Token نامعتبر یا Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'کاربر یافت نشد',
  })
  async getCurrentUser(@User() userId: string) {
    return await this.userService.getCurrentUser(userId);
  }

  @Get('dashboard')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'دریافت اطلاعات Dashboard کاربر',
    description:
      'این endpoint اطلاعات dashboard کاربر (کیف پول، تعداد سفارش‌ها، تعداد آدرس‌ها) را برمی‌گرداند.',
  })
  @ApiResponse({
    status: 200,
    description: 'اطلاعات dashboard با موفقیت برگردانده شد',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            walletBalance: { type: 'number', example: 5000000 },
            ordersCount: { type: 'number', example: 12 },
            addressesCount: { type: 'number', example: 3 },
            phoneNumber: { type: 'string', example: '09123456789' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token نامعتبر یا Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'کاربر یافت نشد',
  })
  async getDashboard(@User() userId: string) {
    return await this.userService.getDashboard(userId);
  }
}
