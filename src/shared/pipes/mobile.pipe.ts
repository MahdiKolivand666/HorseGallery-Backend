import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { convertNumbers } from '../utils/stringUtils';

@Injectable()
export class MobilePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value?.mobile) {
      const mobile = /^09\d{9}$/;

      const englishMobile = convertNumbers(value.mobile);
      const isValidMobile = mobile.test(englishMobile);

      if (!isValidMobile) {
        throw new BadRequestException('شماره موبایل معتبر نیست');
      }
      return { ...value, mobile: englishMobile };
    }
    return value;
  }
}
