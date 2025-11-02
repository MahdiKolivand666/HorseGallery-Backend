import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export class PasswordPipe implements PipeTransform {
  constructor(private readonly isNew: boolean = false) {}

  async transform(
    value: Record<string, unknown> & { password?: string },
    metadata: ArgumentMetadata,
  ) {
    if (value?.password) {
      const password = /^(?=.*[A-Za-z])(?=.*[\d۰-۹])[A-Za-z\d۰-۹@$!%*#?&]{8,}$/;
      const isValidPassword = password.test(value.password);

      if (!isValidPassword) {
        throw new BadRequestException(
          'رمز عبور باید حداقل 8 کاراکتر باشد و شامل حروف و اعداد باشد',
        );
      } else {
        if (this.isNew) {
          const salt = await bcrypt.genSalt();
          const hashedPassword = await bcrypt.hash(value.password, salt);
          return { ...value, password: hashedPassword };
        } else {
          return value;
        }
      }
    }
    return value;
  }
}
