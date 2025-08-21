import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthDto } from '../dtos/auth.dto';
import { MobilePipe } from 'src/shared/pipes/mobile.pipe';
import { PasswordPipe } from 'src/shared/pipes/password.pipe';
import { UserService } from '../services/user.service';
import { ConfirmDto } from '../dtos/confirm.dto';
import { ResendDto } from '../dtos/resend.dto';
import { SignUpDto } from '../dtos/signup.dto';
import { FarsiPipe } from 'src/shared/pipes/farsi.pipe';
import { Role } from '../schemas/user.schema';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('sign-in')
  signIn(@Body(MobilePipe, new PasswordPipe(false)) body: AuthDto) {
    return this.userService.signin(body);
  }

  @Post('confirm')
  confirmCode(@Body(MobilePipe) body: ConfirmDto) {
    return this.userService.confirm(body);
  }

  @Post('resend')
  resendCode(@Body(MobilePipe) body: ResendDto) {
    return this.userService.sendCode(body.mobile);
  }

  @Post('sign-up')
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
}
