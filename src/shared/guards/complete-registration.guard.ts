import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, RegistrationStatus } from 'src/user/schemas/user.schema';
import {
  IncompleteRegistrationException,
  OtpVerificationExpiredException,
} from '../exceptions';

/**
 * Guard برای بررسی اینکه کاربر registrationStatus = 'complete' دارد
 * فقط کاربرانی که اطلاعات کامل (نام، نام خانوادگی، کد ملی) را وارد کرده‌اند
 * می‌توانند خرید کنند
 */
@Injectable()
export class CompleteRegistrationGuard implements CanActivate {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // در JwtGuard، payload._id در request.user قرار می‌گیرد (string)
    const userId = request.user;

    if (!userId) {
      throw new ForbiddenException(
        'برای انجام این عملیات باید وارد حساب کاربری خود شوید',
      );
    }

    // پیدا کردن کاربر
    const user = await this.userModel
      .findById(userId)
      .select('registrationStatus mobile otpVerifiedAt')
      .lean();

    if (!user) {
      throw new ForbiddenException('کاربر یافت نشد');
    }

    // بررسی registrationStatus
    if (user.registrationStatus !== RegistrationStatus.Complete) {
      // ✅ بررسی اینکه آیا otpVerifiedAt بیش از 7 روز گذشته است
      // ✅ اگر گذشته باشد، کاربر باید دوباره OTP بگیرد
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const isOtpVerificationExpired =
        !user.otpVerifiedAt || user.otpVerifiedAt < sevenDaysAgo;

      if (isOtpVerificationExpired) {
        // ✅ OTP verification منقضی شده - کاربر باید دوباره OTP بگیرد
        throw new OtpVerificationExpiredException(user.mobile || null);
      }

      // ✅ کاربر لاگین است اما اطلاعات کامل ندارد
      // ✅ خطای مخصوص که نشان می‌دهد کاربر لاگین است و فقط باید فرم تکمیل اطلاعات را نشان دهد
      throw new IncompleteRegistrationException(user.mobile || null);
    }

    return true;
  }
}
