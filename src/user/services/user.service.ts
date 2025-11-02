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

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
    private readonly configService: ConfigService,
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

  async signin(body: AuthDto) {
    const { mobile, password } = body;
    const user = await this.findOneByMobile(mobile);

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      throw new BadRequestException('رمز عبور اشتباه است');
    } else {
      await this.sendCode(mobile);
    }
  }

  async confirm(body: ConfirmDto) {
    const { mobile, code } = body;
    const user = await this.findOneByMobile(mobile);

    // Check if code exists
    if (!user.code) {
      throw new BadRequestException(
        'کد تایید یافت نشد. لطفاً مجدد درخواست کنید',
      );
    }

    // Check if code is expired
    if (user.codeExpiry && new Date() > user.codeExpiry) {
      throw new BadRequestException('کد تایید منقضی شده است');
    }

    // Check code attempts limit
    if (user.codeAttempts >= 3) {
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

      throw new BadRequestException(
        `کد اشتباه است. ${3 - user.codeAttempts} تلاش باقی مانده`,
      );
    }

    // Code is correct - generate JWT token
    const payload = { _id: user._id, role: user.role };
    const token = this.jwtService.sign(payload);

    // Clear verification code data
    user.code = undefined;
    user.codeExpiry = undefined;
    user.codeAttempts = 0;
    await user.save();

    return {
      access_token: token,
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

    // Rate limiting: Check if user sent too many codes
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Reset counter if last code was sent more than 1 hour ago
    if (!user.lastCodeSentAt || user.lastCodeSentAt < oneHourAgo) {
      user.codeSentCount = 0;
    }

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
        throw new BadRequestException(`لطفاً ${waitTime} ثانیه دیگر صبر کنید`);
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

    if (!smsSent) {
      throw new BadRequestException(
        'خطا در ارسال پیامک. لطفاً دوباره تلاش کنید',
      );
    }

    return {
      message: 'کد تایید با موفقیت ارسال شد',
      expiresIn: '2 دقیقه',
    };
  }
}
