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

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
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

    const isCodeCorrect = await bcrypt.compare(code, user.code);

    if (!isCodeCorrect) {
      throw new BadRequestException('کد اشتباه است');
    } else {
      const payload = { _id: user._id, role: user.role };
      const token = this.jwtService.sign(payload);
      return { token };
    }
  }

  async sendCode(mobile: string) {
    const user = await this.findOneByMobile(mobile);
    const code = Math.floor(Math.random() * 900000) + 100000;
    const salt = await bcrypt.genSalt();
    const hashedCode = await bcrypt.hash(code.toString(), salt);

    user.code = hashedCode;
    await user.save();

    // Note: In production, verification code should be sent via SMS/Email
    // Do not log the code for security reasons
  }
}
