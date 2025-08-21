import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ChangePasswordDto } from 'src/user/dtos/change-password.dto';
import { UserService } from 'src/user/services/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChangePasswordPipe implements PipeTransform {
  constructor(private readonly userService: UserService) {}
  async transform(value: ChangePasswordDto, metadata: ArgumentMetadata) {
    const { id, oldPassword, newPassword } = value;
    const password = /^(?=.*[A-Za-z])(?=.*[\d۰-۹])[A-Za-z\d۰-۹@$!%*#?&]{8,}$/;
    const isValidOldPassword = password.test(oldPassword);
    const isValidNewPassword = password.test(newPassword);

    if (!isValidOldPassword || !isValidNewPassword) {
      throw new BadRequestException(
        'رمز عبور باید حداقل 8 کاراکتر باشد و شامل حروف و اعداد باشد',
      );
    }

    const user = await this.userService.findOne(id, {
      password: 1,
    });

    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordCorrect) {
      throw new BadRequestException('رمز عبور قدیمی صحیح نیست');
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await this.userService.update(id, { password: hashedPassword });
    return {
      newPassword: hashedPassword,
      id: id,
    };
  }
}
