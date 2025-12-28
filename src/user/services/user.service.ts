import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OtpExpiredException,
  OtpInvalidException,
} from 'src/shared/exceptions';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema';
import { Model, Types } from 'mongoose';
import { Order, OrderStatus } from 'src/shop/schemas/order.schema';
import { Address as ShopAddress } from 'src/shop/schemas/address.schema';
import { UserQueryDto } from '../dtos/user-query.dto';
import { sortFunction } from 'src/shared/utils/sort-utils';
import { UserDto } from '../dtos/user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { AuthDto } from '../dtos/auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfirmDto } from '../dtos/confirm.dto';
import { SendOtpDto } from '../dtos/send-otp.dto';
import { VerifyOtpDto } from '../dtos/verify-otp.dto';
import { RegisterDto } from '../dtos/register.dto';
import { SmsService } from 'src/shared/services/sms.service';
import { ConfigService } from '@nestjs/config';
import { SecurityLogService } from 'src/shared/services/security-log.service';
import { TokenBlacklistService } from 'src/shared/services/token-blacklist.service';
import { Role, RegistrationStatus } from '../schemas/user.schema';
import type { Request } from 'express';
import { randomUUID } from 'crypto';
import { Logger } from '@nestjs/common';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(ShopAddress.name)
    private readonly addressModel: Model<ShopAddress>,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
    private readonly securityLogService: SecurityLogService,
    private readonly tokenBlacklistService: TokenBlacklistService,
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

  /**
   * پیدا کردن کاربر بر اساس شماره موبایل (بدون throw کردن exception)
   */
  async findOneByMobileOrNull(mobile: string) {
    // ✅ اطمینان از اینکه همه فیلدها (از جمله code و codeExpiry) برگردانده می‌شوند
    return await this.userModel.findOne({ mobile: mobile });
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
      throw new OtpExpiredException();
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

      throw new OtpInvalidException(3 - user.codeAttempts);
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
      const jti = randomUUID();
      const newPayload = {
        _id: user._id,
        role: user.role,
        jti, // ✅ JWT ID برای tracking و blacklist
        iat: Math.floor(Date.now() / 1000), // ✅ Issued at
      };
      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m', // 15 minutes
      });

      return {
        success: true,
        message: 'Token با موفقیت refresh شد',
        access_token: newAccessToken,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, tokenId?: string) {
    const user = await this.findOne(userId);

    // ✅ اگر tokenId وجود دارد، آن را به blacklist اضافه کن
    if (tokenId) {
      try {
        // ✅ Decode token برای گرفتن expiration time
        const decoded = this.jwtService.decode(tokenId);
        if (
          decoded &&
          typeof decoded === 'object' &&
          decoded !== null &&
          'exp' in decoded
        ) {
          const expiresAt = new Date(decoded.exp * 1000);
          await this.tokenBlacklistService.addToBlacklist(
            decoded.jti || tokenId, // ✅ از jti استفاده کن، اگر نبود از tokenId
            userId,
            expiresAt,
          );
        }
      } catch (error) {
        // اگر decode failed، ignore می‌کنیم
        this.logger.warn(
          `Failed to decode token for blacklist: ${error.message}`,
        );
      }
    }

    // ✅ Revoke تمام refresh token های کاربر
    await this.tokenBlacklistService.revokeAllUserTokens(userId);

    // Clear refresh token
    user.refreshToken = undefined;
    user.refreshTokenExpiry = undefined;
    await user.save();

    return {
      success: true,
      message: 'با موفقیت خارج شدید',
    };
  }

  /**
   * ارسال کد OTP (برای کاربران جدید و موجود)
   * مطابق با مستندات frontend: POST /auth/send-otp
   */
  async sendOtp(body: SendOtpDto, req?: Request) {
    const { phoneNumber } = body;
    const isDevelopment = this.configService.get('NODE_ENV') !== 'production';
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000); // 5 دقیقه پیش

    // پیدا کردن یا ایجاد کاربر
    let user = await this.findOneByMobileOrNull(phoneNumber);

    if (!user) {
      // اگر کاربر جدید باشد، کاربر جدید ایجاد کن
      user = await this.userModel.create({
        mobile: phoneNumber,
        role: Role.User,
        codeSentCount: 0,
        codeAttempts: 0,
        isActive: true,
      });
    }

    // Rate limiting: بررسی درخواست‌های 5 دقیقه گذشته
    if (!user.lastCodeSentAt || user.lastCodeSentAt < fiveMinutesAgo) {
      user.codeSentCount = 0;
    }

    // در development mode، rate limiting را skip کن
    if (!isDevelopment) {
      // بررسی rate limit (حداکثر 3 درخواست در 5 دقیقه)
      if (user.codeSentCount >= 3) {
        throw new BadRequestException(
          'درخواست‌های زیادی ارسال شده است. لطفاً چند دقیقه صبر کنید',
        );
      }

      // بررسی اینکه آیا اخیراً کد ارسال شده (حداقل 60 ثانیه)
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

    // تولید کد 6 رقمی
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash کردن کد برای ذخیره
    const salt = await bcrypt.genSalt();
    const hashedCode = await bcrypt.hash(otpCode, salt);

    // تنظیم زمان انقضا (2 دقیقه)
    const codeExpiry = new Date(now.getTime() + 2 * 60 * 1000);

    // به‌روزرسانی کاربر
    user.code = hashedCode;
    user.codeExpiry = codeExpiry;
    user.codeAttempts = 0;
    user.lastCodeSentAt = now;
    user.codeSentCount += 1;

    // ✅ اطمینان از ذخیره شدن فیلدهای optional
    user.markModified('code');
    user.markModified('codeExpiry');

    await user.save();

    // ارسال SMS
    const smsSent = await this.smsService.sendVerificationCode(
      phoneNumber,
      otpCode,
    );

    // در development mode، حتی اگر SMS fail شود، کد را برگردان
    if (!smsSent && !isDevelopment) {
      throw new BadRequestException(
        'خطا در ارسال پیامک. لطفاً دوباره تلاش کنید',
      );
    }

    // محاسبه زمان باقی‌مانده
    const remainingSeconds = 120; // 2 دقیقه = 120 ثانیه

    // ساخت response
    const response: {
      success: boolean;
      message: string;
      data: {
        expiresIn: number;
        expiresAt: string; // ISO 8601 format
        remainingSeconds: number;
      };
      code?: string; // فقط در development
    } = {
      success: true,
      message: 'کد تأیید به شماره موبایل شما ارسال شد',
      data: {
        expiresIn: 120, // 2 دقیقه به ثانیه (برای backward compatibility)
        expiresAt: codeExpiry.toISOString(), // زمان انقضا در ISO 8601 format
        remainingSeconds, // زمان باقی‌مانده به ثانیه
      },
    };

    // در development mode، کد را در response قرار بده
    if (isDevelopment || !smsSent) {
      response.code = otpCode;
      response.message = 'کد تأیید (Development Mode - کد در response)';
    }

    return response;
  }

  /**
   * تأیید کد OTP و دریافت Token (برای کاربران جدید و موجود)
   * مطابق با مستندات frontend: POST /auth/verify-otp
   */
  async verifyOtp(body: VerifyOtpDto, req?: Request) {
    try {
      const { phoneNumber, otpCode } = body;
      const ipAddress = req?.ip || 'unknown';

      // پیدا کردن کاربر
      const user = await this.findOneByMobileOrNull(phoneNumber);

      // اگر کاربر وجود نداشت، خطا بده (باید ابتدا send-otp را فراخوانی کند)
      if (!user) {
        await this.securityLogService.logLoginFailed(
          phoneNumber,
          ipAddress,
          'User not found - OTP not sent',
          req?.headers['user-agent'],
        );
        throw new BadRequestException(
          'کد تأیید یافت نشد. لطفاً ابتدا کد تأیید را دریافت کنید',
        );
      }

      // ✅ همه کاربران (چه pending چه complete) همیشه باید OTP را verify کنند
      // بررسی وجود کد در database
      if (!user.code) {
        await this.securityLogService.logLoginFailed(
          phoneNumber,
          ipAddress,
          'Code not found',
          req?.headers['user-agent'],
        );
        throw new BadRequestException(
          'کد تأیید یافت نشد. لطفاً مجدد درخواست کنید',
        );
      }

      // بررسی انقضای کد
      if (user.codeExpiry && new Date() > user.codeExpiry) {
        await this.securityLogService.logLoginFailed(
          phoneNumber,
          ipAddress,
          'Code expired',
          req?.headers['user-agent'],
        );
        throw new OtpExpiredException();
      }

      // بررسی تعداد تلاش‌ها (حداکثر 5 تلاش)
      if (user.codeAttempts >= 5) {
        await this.securityLogService.logLoginFailed(
          phoneNumber,
          ipAddress,
          'Too many failed attempts',
          req?.headers['user-agent'],
        );
        // کد را invalid کن
        user.code = undefined;
        user.codeExpiry = undefined;
        await user.save();
        throw new BadRequestException(
          'تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کد جدید دریافت کنید',
        );
      }

      // تأیید کد
      const isCodeCorrect = await bcrypt.compare(otpCode, user.code);

      if (!isCodeCorrect) {
        // افزایش تعداد تلاش‌های ناموفق
        user.codeAttempts += 1;
        await user.save();

        await this.securityLogService.logLoginFailed(
          phoneNumber,
          ipAddress,
          'Incorrect code',
          req?.headers['user-agent'],
        );

        throw new OtpInvalidException(5 - user.codeAttempts);
      }

      // کد صحیح است - اگر کاربر جدید باشد، فقط lastLogin را به‌روزرسانی کن
      // اطلاعات تکمیلی باید از endpoint /auth/register وارد شوند

      // ✅ محاسبه expiresAt و remainingSeconds قبل از تغییر user.codeExpiry
      // ✅ این فیلدها باید همیشه برگردانده شوند (حتی اگر کاربر complete است)
      const now = new Date();
      // ✅ اگر codeExpiry وجود دارد، از آن استفاده کن (برای کاربران pending)
      // ✅ اگر codeExpiry وجود ندارد، از now استفاده کن (برای کاربران complete که کد حذف شده)
      const expiresAt = user.codeExpiry ? new Date(user.codeExpiry) : now; // اگر کد حذف شده باشد (کاربر complete)، از now استفاده کن
      const remainingSeconds = Math.max(
        0,
        Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
      );

      // ✅ تولید Access Token (15 دقیقه expiration) با jti
      const jti = randomUUID();
      const payload = {
        _id: user._id,
        role: user.role,
        jti, // ✅ JWT ID برای tracking و blacklist
        iat: Math.floor(Date.now() / 1000), // ✅ Issued at
      };
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: '15m', // ✅ 15 دقیقه
        // ✅ jwtid حذف شد چون jti در payload است
      });

      // ✅ تولید Refresh Token (7 روز expiration)
      const refreshTokenPayload = {
        _id: user._id,
        role: user.role,
        type: 'refresh',
        jti: randomUUID(), // ✅ JWT ID جداگانه برای refresh token
      };
      const refreshToken = this.jwtService.sign(refreshTokenPayload, {
        expiresIn: '7d', // ✅ 7 روز
        // ✅ jwtid حذف شد چون jti در payload است
      });

      // ✅ Hash و ذخیره refresh token در database
      const salt = await bcrypt.genSalt();
      const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
      user.refreshToken = hashedRefreshToken;
      user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 روز

      // ✅ تنظیم registrationStatus بر اساس اطلاعات کاربر
      // اگر کاربر فقط شماره تلفن دارد (نام و ... ندارد)، status را 'pending' قرار بده
      const hasCompleteInfo = !!(
        user.firstName &&
        user.lastName &&
        user.nationalCode
      );
      if (!hasCompleteInfo) {
        user.registrationStatus = RegistrationStatus.Pending;
      } else {
        // ✅ اگر کاربر اطلاعات کامل دارد، registrationStatus را به 'complete' set کن
        user.registrationStatus = RegistrationStatus.Complete;
      }

      // ✅ اگر کاربر اطلاعات کامل دارد (complete)، کد OTP را حذف کن
      // ✅ اگر کاربر اطلاعات کامل ندارد (pending)، کد OTP را نگه دار تا register کامل شود
      if (hasCompleteInfo) {
        // کاربر اطلاعات کامل دارد - کد OTP را حذف کن
        user.code = undefined;
        user.codeExpiry = undefined;
      }
      // اگر اطلاعات کامل ندارد، کد OTP را نگه دار (برای register)
      // ✅ ثبت زمان verify شدن کد OTP
      if (!hasCompleteInfo) {
        user.otpVerifiedAt = new Date();
      }

      user.codeAttempts = 0;
      user.lastLogin = new Date();

      await user.save();

      // Log successful login
      await this.securityLogService.logLoginSuccess(
        (user._id as Types.ObjectId).toString(),
        phoneNumber,
        ipAddress,
        req?.headers['user-agent'],
      );

      // ✅ بررسی اینکه آیا کاربر قبلاً ثبت‌نام کرده است
      // ✅ باید بر اساس registrationStatus باشد، نه فقط nationalCode
      const isRegistered =
        user.registrationStatus === RegistrationStatus.Complete;

      const response = {
        success: true,
        message: isRegistered
          ? 'ورود با موفقیت انجام شد'
          : 'کد تأیید صحیح است. لطفاً اطلاعات تکمیلی را وارد کنید',
        data: {
          token: accessToken, // ✅ Access Token
          refreshToken: refreshToken, // ✅ Refresh Token
          user: {
            id: (user._id as Types.ObjectId).toString(),
            phoneNumber: user.mobile,
            firstName: user.firstName || null,
            lastName: user.lastName || null,
            nationalId: user.nationalCode || null,
            email: user.email || null,
            registrationStatus: user.registrationStatus, // ✅ باید 'complete' یا 'pending' باشد
          },
          isRegistered, // ✅ نشان می‌دهد که آیا کاربر قبلاً ثبت‌نام کرده است (بر اساس registrationStatus)
          expiresAt: expiresAt.toISOString(), // ✅ زمان انقضای OTP در ISO 8601 format
          remainingSeconds, // ✅ زمان باقی‌مانده به ثانیه
        },
      };

      return response;
    } catch (error) {
      this.logger.error(
        `Error in verifyOtp method: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * ثبت‌نام کاربر با اطلاعات تکمیلی
   * مطابق با مستندات frontend: POST /auth/register
   */
  async register(body: RegisterDto, req?: Request) {
    try {
      const { phoneNumber, otpCode, firstName, lastName, nationalId, email } =
        body;
      const ipAddress = req?.ip || 'unknown';

      // پیدا کردن کاربر
      const user = await this.findOneByMobileOrNull(phoneNumber);

      // اگر کاربر وجود نداشت، خطا بده (باید ابتدا send-otp را فراخوانی کند)
      if (!user) {
        await this.securityLogService.logLoginFailed(
          phoneNumber,
          ipAddress,
          'User not found - OTP not sent',
          req?.headers['user-agent'],
        );
        throw new BadRequestException(
          'کد تأیید یافت نشد. لطفاً ابتدا کد تأیید را دریافت کنید',
        );
      }

      // ✅ اگر کاربر قبلاً کد OTP را verify کرده (در verifyOtp)، نیازی به verify دوباره نیست
      // ✅ فقط چک می‌کنیم که verify اخیراً انجام شده (در 10 دقیقه گذشته)
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
      const isOtpRecentlyVerified =
        user.otpVerifiedAt && user.otpVerifiedAt > tenMinutesAgo;

      if (!isOtpRecentlyVerified) {
        // ✅ اگر کد OTP اخیراً verify نشده، باید دوباره verify شود
        // بررسی وجود کد
        if (!user.code) {
          await this.securityLogService.logLoginFailed(
            phoneNumber,
            ipAddress,
            'Code not found',
            req?.headers['user-agent'],
          );
          throw new BadRequestException(
            'کد تأیید یافت نشد. لطفاً مجدد درخواست کنید',
          );
        }

        // بررسی انقضای کد
        if (user.codeExpiry && new Date() > user.codeExpiry) {
          await this.securityLogService.logLoginFailed(
            phoneNumber,
            ipAddress,
            'Code expired',
            req?.headers['user-agent'],
          );
          throw new OtpExpiredException();
        }

        // بررسی تعداد تلاش‌ها (حداکثر 5 تلاش)
        if (user.codeAttempts >= 5) {
          await this.securityLogService.logLoginFailed(
            phoneNumber,
            ipAddress,
            'Too many failed attempts',
            req?.headers['user-agent'],
          );
          // کد را invalid کن
          user.code = undefined;
          user.codeExpiry = undefined;
          await user.save();
          throw new BadRequestException(
            'تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کد جدید دریافت کنید',
          );
        }

        // تأیید کد
        const isCodeCorrect = await bcrypt.compare(otpCode, user.code);

        if (!isCodeCorrect) {
          // افزایش تعداد تلاش‌های ناموفق
          user.codeAttempts += 1;
          await user.save();

          await this.securityLogService.logLoginFailed(
            phoneNumber,
            ipAddress,
            'Incorrect code',
            req?.headers['user-agent'],
          );

          throw new BadRequestException(
            `کد تأیید نامعتبر است. ${5 - user.codeAttempts} تلاش باقی مانده`,
          );
        }

        // ✅ ثبت زمان verify شدن کد OTP
        user.otpVerifiedAt = new Date();
      }
      // ✅ اگر کد OTP اخیراً verify شده، skip می‌کنیم

      // بررسی اینکه آیا کاربر قبلاً ثبت‌نام کرده است
      // اگر کاربر دارای nationalCode باشد و کد ملی جدید با کد ملی موجود متفاوت باشد، خطا بده
      // اما اگر کد ملی یکسان باشد، اجازه به‌روزرسانی اطلاعات را بده
      if (user.nationalCode && user.nationalCode !== nationalId.trim()) {
        throw new ConflictException(
          'این شماره موبایل قبلاً ثبت‌نام شده است. لطفاً وارد حساب کاربری خود شوید',
        );
      }

      // بررسی کد ملی تکراری (اگر وجود داشته باشد)
      if (nationalId) {
        const existingUserWithNationalId = await this.userModel.findOne({
          nationalCode: nationalId,
          _id: { $ne: user._id },
        });

        if (existingUserWithNationalId) {
          throw new ConflictException('این کد ملی قبلاً ثبت شده است');
        }
      }

      // به‌روزرسانی اطلاعات کاربر
      user.firstName = firstName.trim();
      user.lastName = lastName.trim();
      user.nationalCode = nationalId.trim();
      user.email = email && email.trim() !== '' ? email.trim() : undefined;

      // ✅ تنظیم registrationStatus به 'complete' چون اطلاعات کامل وارد شده
      user.registrationStatus = RegistrationStatus.Complete;

      // پاک کردن کد تأیید و اطلاعات verify
      user.code = undefined;
      user.codeExpiry = undefined;
      user.otpVerifiedAt = undefined; // ✅ پاک کردن flag verify
      user.codeAttempts = 0;
      user.lastLogin = new Date();

      // ✅ ذخیره تغییرات اولیه (اطلاعات کاربر)
      await user.save();

      // ✅ تولید Access Token (15 دقیقه expiration) با jti
      const jti = randomUUID();
      const payload = {
        _id: user._id,
        role: user.role,
        jti, // ✅ JWT ID برای tracking و blacklist
        iat: Math.floor(Date.now() / 1000), // ✅ Issued at
      };
      const accessToken = this.jwtService.sign(payload, {
        expiresIn: '15m', // ✅ 15 دقیقه
        // ✅ jwtid حذف شد چون jti در payload است
      });

      // ✅ تولید Refresh Token (7 روز expiration)
      const refreshTokenPayload = {
        _id: user._id,
        role: user.role,
        type: 'refresh',
        jti: randomUUID(), // ✅ JWT ID جداگانه برای refresh token
      };
      const refreshToken = this.jwtService.sign(refreshTokenPayload, {
        expiresIn: '7d', // ✅ 7 روز
        // ✅ jwtid حذف شد چون jti در payload است
      });

      // ✅ Hash و ذخیره refresh token در database
      const salt = await bcrypt.genSalt();
      const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

      // ✅ به‌روزرسانی refresh token در document موجود
      user.refreshToken = hashedRefreshToken;
      user.refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 روز

      // ✅ ذخیره نهایی (refresh token)
      await user.save();

      // ✅ اطمینان از به‌روزرسانی با refresh کردن document از database
      // این کار باعث می‌شود که اگر cache وجود داشته باشد، به‌روزرسانی شود
      const updatedUser = await this.userModel.findById(user._id).lean();

      // Log successful registration
      await this.securityLogService.logLoginSuccess(
        (user._id as Types.ObjectId).toString(),
        phoneNumber,
        ipAddress,
        req?.headers['user-agent'],
      );

      // ✅ استفاده از updatedUser برای اطمینان از داده‌های به‌روز
      // ✅ updatedUser از database خوانده شده و به‌روز است
      const finalUser = updatedUser || user;

      // ✅ اطمینان از اینکه _id به string تبدیل می‌شود
      const userId = updatedUser?._id
        ? (updatedUser._id as Types.ObjectId).toString()
        : (user._id as Types.ObjectId).toString();

      const response = {
        success: true,
        message: 'ثبت‌نام با موفقیت انجام شد',
        data: {
          token: accessToken, // ✅ Access Token
          refreshToken: refreshToken, // ✅ Refresh Token
          user: {
            id: userId,
            phoneNumber: finalUser.mobile || user.mobile,
            firstName: finalUser.firstName || user.firstName,
            lastName: finalUser.lastName || user.lastName,
            nationalId: finalUser.nationalCode || user.nationalCode,
            email: finalUser.email || user.email || null, // ✅ اگر undefined باشد، null برگردان
            registrationStatus:
              finalUser.registrationStatus ||
              user.registrationStatus ||
              RegistrationStatus.Complete,
          },
        },
      };

      return response;
    } catch (error) {
      this.logger.error(
        `Error in register method: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * دریافت زمان باقی‌مانده کد OTP
   * مطابق با مستندات frontend: GET /auth/otp/remaining-time
   */
  async getOtpRemainingTime(phoneNumber: string) {
    // Validation: شماره موبایل باید معتبر باشد
    if (!/^09\d{9}$/.test(phoneNumber)) {
      throw new BadRequestException('شماره موبایل نامعتبر است');
    }

    // پیدا کردن کاربر
    const user = await this.findOneByMobileOrNull(phoneNumber);

    // اگر کاربر وجود نداشت یا کد OTP وجود نداشت
    if (!user || !user.code || !user.codeExpiry) {
      throw new NotFoundException('کد تأیید یافت نشد');
    }

    // محاسبه زمان باقی‌مانده
    const now = new Date();
    const expiresAt = new Date(user.codeExpiry);
    const diff = Math.floor((expiresAt.getTime() - now.getTime()) / 1000); // به ثانیه

    const remainingSeconds = Math.max(0, diff);
    const isExpired = diff <= 0;

    return {
      success: true,
      data: {
        remainingSeconds,
        expiresAt: expiresAt.toISOString(),
        isExpired,
      },
    };
  }

  /**
   * دریافت اطلاعات کاربر فعلی
   * مطابق با مستندات frontend: GET /auth/me
   */
  async getCurrentUser(userId: string) {
    // پیدا کردن کاربر
    const user = await this.userModel
      .findById(userId)
      .select(
        'mobile firstName lastName nationalCode email registrationStatus',
      );

    if (!user) {
      throw new NotFoundException('کاربر یافت نشد');
    }

    return {
      success: true,
      data: {
        user: {
          id: (user._id as Types.ObjectId).toString(),
          phoneNumber: user.mobile,
          firstName: user.firstName || null,
          lastName: user.lastName || null,
          nationalId: user.nationalCode || null,
          email: user.email || null,
          registrationStatus: user.registrationStatus, // ✅ باید 'complete' یا 'pending' باشد
        },
      },
    };
  }

  /**
   * دریافت اطلاعات Dashboard کاربر
   * مطابق با مستندات frontend: GET /auth/dashboard
   */
  async getDashboard(userId: string) {
    // پیدا کردن کاربر
    const user = await this.userModel
      .findById(userId)
      .select('mobile walletBalance')
      .lean();

    if (!user) {
      throw new NotFoundException('کاربر یافت نشد');
    }

    // ✅ شمارش تعداد سفارش‌ها
    // ✅ شمارش تمام سفارش‌های کاربر (بدون فیلتر status)
    // ✅ شامل: paying, paid, sent, canceled
    // ✅ استفاده از user field (مطابق با Order schema)
    const userIdObjectId = new Types.ObjectId(userId);
    const ordersCount = await this.orderModel.countDocuments({
      user: userIdObjectId,
    });

    // ✅ شمارش تعداد آدرس‌ها
    // ✅ استفاده از userId field (مطابق با Address schema)
    const addressesCount = await this.addressModel.countDocuments({
      userId: userIdObjectId,
    });

    // ✅ مبلغ کیف پول (از فیلد walletBalance در User model)
    const walletBalance = user.walletBalance || 0;

    return {
      success: true,
      data: {
        walletBalance: walletBalance,
        ordersCount: ordersCount,
        addressesCount: addressesCount,
        phoneNumber: user.mobile,
      },
    };
  }
}
