import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { UserQueryDto } from '../dtos/user-query.dto';
import { sortFunction } from 'src/shared/utils/sort-utils';
import { UserDto } from '../dtos/user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { AuthDto } from '../dtos/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfirmDto } from '../dtos/confirm.dto';
import { SmsService } from 'src/shared/services/sms.service';
import { ConfigService } from '@nestjs/config';
import { SecurityLogService } from 'src/shared/services/security-log.service';
import type { Request } from 'express';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
    private readonly securityLogService: SecurityLogService,
  ) {}

  async findAll(
    queryParams: UserQueryDto,
    selectObject: Record<string, 0 | 1> = { __v: 0 },
  ) {
    const { limit = 5, page = 1, sort, lastName, mobile } = queryParams;

    const query: Record<string, unknown> = {};

    if (lastName) {
      query.lastName = { $regex: lastName, $options: 'i' };
    }

    if (mobile) {
      query.mobile = { $regex: mobile, $options: 'i' };
    }

    const sortObject = sortFunction(sort);

    const users = await this.userModel
      .find(query)
      .sort(sortObject)
      .select(selectObject)
      .skip(page - 1)
      .limit(limit)
      .exec();

    const count = await this.userModel.countDocuments(query);

    return { count, users };
  }

  async findOne(id: string, selectObject: Record<string, 0 | 1> = { __v: 0 }) {
    const user = await this.userModel
      .findOne({ _id: id })
      .select(selectObject)
      .exec();
    if (user) {
      return user;
    } else {
      throw new NotFoundException();
    }
  }

  async create(body: UserDto) {
    const newUser = new this.userModel(body);
    await newUser.save();
    return newUser;
  }

  async update(id: string, body: UpdateUserDto) {
    return await this.userModel.findByIdAndUpdate(id, body, { new: true });
  }

  async delete(id: string) {
    const user = await this.findOne(id);
    await user.deleteOne();
    return user;
  }

  async findOneByMobile(mobile: string) {
    const user = await this.userModel.findOne({ mobile: mobile });
    if (user) {
      return user;
    } else {
      throw new NotFoundException();
    }
  }

  async signin(body: AuthDto, req?: Request) {
    const { mobile, password } = body;
    const ipAddress = req?.ip || 'unknown';

    try {
      const user = await this.findOneByMobile(mobile);

      const isPasswordCorrect = await bcrypt.compare(password, user.password);

      if (!isPasswordCorrect) {
        // Log failed attempt
        await this.securityLogService.logLoginFailed(
          mobile,
          ipAddress,
          'Incorrect password',
          req?.headers['user-agent'],
        );
        throw new BadRequestException('رمز عبور اشتباه است');
      } else {
        // Send verification code and return response
        return await this.sendCode(mobile);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Log failed attempt (user not found)
        await this.securityLogService.logLoginFailed(
          mobile,
          ipAddress,
          'User not found',
          req?.headers['user-agent'],
        );
      }
      throw error;
    }
  }

  async confirm(body: ConfirmDto, req?: Request) {
    const { mobile, code } = body;
    const user = await this.findOneByMobile(mobile);
    const ipAddress = req?.ip || 'unknown';

    // Check if code exists
    if (!user.code) {
      await this.securityLogService.logLoginFailed(
        mobile,
        ipAddress,
        'Code not found',
        req?.headers['user-agent'],
      );
      throw new BadRequestException(
        'کد تایید یافت نشد. لطفاً مجدد درخواست کنید',
      );
    }

    // Check if code is expired
    if (user.codeExpiry && new Date() > user.codeExpiry) {
      await this.securityLogService.logLoginFailed(
        mobile,
        ipAddress,
        'Code expired',
        req?.headers['user-agent'],
      );
      throw new BadRequestException('کد تایید منقضی شده است');
    }

    // Check code attempts limit
    if (user.codeAttempts >= 3) {
      await this.securityLogService.logLoginFailed(
        mobile,
        ipAddress,
        'Too many failed attempts',
        req?.headers['user-agent'],
      );
      throw new BadRequestException(
        'تعداد تلاش‌های اشتباه بیش از حد مجاز. لطفاً کد جدید درخواست کنید',
      );
    }

    // Verify code
    const isCodeCorrect = await bcrypt.compare(code, user.code);

    if (!isCodeCorrect) {
      // Increment failed attempts
      user.codeAttempts += 1;
      await user.save();

      await this.securityLogService.logLoginFailed(
        mobile,
        ipAddress,
        'Incorrect code',
        req?.headers['user-agent'],
      );

      throw new BadRequestException(
        `کد اشتباه است. ${3 - user.codeAttempts} تلاش باقی مانده`,
      );
    }

    // Code is correct - generate JWT access token (15 minutes expiry)
    const payload = { _id: user._id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m', // 15 minutes
    });

    // Generate refresh token (7 days expiry)
    const refreshTokenPayload = {
      _id: user._id,
      type: 'refresh',
    };
    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      expiresIn: '7d', // 7 days
    });

    // Hash refresh token for storage
    const salt = await bcrypt.genSalt();
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

    // Set refresh token expiry (7 days from now)
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    // Clear verification code data and save refresh token
    user.code = undefined;
    user.codeExpiry = undefined;
    user.codeAttempts = 0;
    user.refreshToken = hashedRefreshToken;
    user.refreshTokenExpiry = refreshTokenExpiry;
    await user.save();

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        _id: user._id,
        mobile: user.mobile,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async sendCode(mobile: string) {
    const user = await this.findOneByMobile(mobile);
    const isDevelopment = this.configService.get('NODE_ENV') !== 'production';

    // Rate limiting: Check if user sent too many codes
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Reset counter if last code was sent more than 1 hour ago
    if (!user.lastCodeSentAt || user.lastCodeSentAt < oneHourAgo) {
      user.codeSentCount = 0;
    }

    // In development mode, skip rate limiting
    if (!isDevelopment) {
      // Check rate limit (max 3 codes per hour)
      if (user.codeSentCount >= 3) {
        throw new BadRequestException(
          'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً یک ساعت دیگر تلاش کنید',
        );
      }

      // Check if user sent code recently (wait at least 60 seconds)
      if (user.lastCodeSentAt) {
        const secondsSinceLastCode =
          (now.getTime() - user.lastCodeSentAt.getTime()) / 1000;

        if (secondsSinceLastCode < 60) {
          const waitTime = Math.ceil(60 - secondsSinceLastCode);
          throw new BadRequestException(
            `لطفاً ${waitTime} ثانیه دیگر صبر کنید`,
          );
        }
      }
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the code for storage
    const salt = await bcrypt.genSalt();
    const hashedCode = await bcrypt.hash(code, salt);

    // Set code expiry (2 minutes)
    const codeExpiry = new Date(now.getTime() + 2 * 60 * 1000);

    // Update user
    user.code = hashedCode;
    user.codeExpiry = codeExpiry;
    user.codeAttempts = 0;
    user.lastCodeSentAt = now;
    user.codeSentCount += 1;
    await user.save();

    // Send SMS
    const smsSent = await this.smsService.sendVerificationCode(mobile, code);

    // In development mode, return the code even if SMS fails
    if (!smsSent && !isDevelopment) {
      throw new BadRequestException(
        'خطا در ارسال پیامک. لطفاً دوباره تلاش کنید',
      );
    }

    // Build response
    const response: {
      message: string;
      expiresIn: string;
      code?: string; // Only in development
    } = {
      message: 'کد تایید با موفقیت ارسال شد',
      expiresIn: '2 دقیقه',
    };

    // In development mode, include the code in response
    if (isDevelopment || !smsSent) {
      response.code = code;
      response.message = 'کد تایید (Development Mode - کد در response)';
    }

    return response;
  }

  async getVerificationCode(mobile: string) {
    const user = await this.findOneByMobile(mobile);

    if (!user.code) {
      return {
        message: 'کد تایید یافت نشد. لطفاً ابتدا لاگین کنید',
        hasCode: false,
      };
    }

    // Check if code is expired
    const isExpired = user.codeExpiry && new Date() > user.codeExpiry;

    return {
      message: isExpired
        ? 'کد تایید منقضی شده است'
        : 'کد تایید فعال است (در database hash شده است)',
      hasCode: !isExpired,
      codeExpiry: user.codeExpiry,
      codeAttempts: user.codeAttempts,
      note: 'کد در database به صورت hash ذخیره شده. برای دیدن کد واقعی، console terminal رو چک کن (کد در log چاپ میشه)',
    };
  }

  async resetRateLimit(mobile: string) {
    const user = await this.findOneByMobile(mobile);

    user.codeSentCount = 0;
    user.lastCodeSentAt = undefined;
    await user.save();

    return {
      message: 'Rate limit reset successfully',
      mobile: user.mobile,
    };
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken);

      // Check if it's a refresh token
      if (payload.type !== 'refresh') {
        throw new BadRequestException('Invalid token type');
      }

      // Find user
      const user = await this.findOne(payload._id);

      // Check if refresh token exists in database
      if (!user.refreshToken) {
        throw new BadRequestException('Refresh token not found');
      }

      // Verify the refresh token matches the stored hash
      const isTokenValid = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!isTokenValid) {
        throw new BadRequestException('Invalid refresh token');
      }

      // Check if refresh token is expired
      if (user.refreshTokenExpiry && new Date() > user.refreshTokenExpiry) {
        throw new BadRequestException('Refresh token expired');
      }

      // Generate new access token
      const newPayload = { _id: user._id, role: user.role };
      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m', // 15 minutes
      });

      return {
        access_token: newAccessToken,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    const user = await this.findOne(userId);

    // Clear refresh token
    user.refreshToken = undefined;
    user.refreshTokenExpiry = undefined;
    await user.save();

    return {
      message: 'Logout successful',
    };
  }
}
