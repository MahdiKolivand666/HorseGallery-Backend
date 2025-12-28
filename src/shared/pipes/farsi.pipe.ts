import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class FarsiPipe implements PipeTransform {
  transform(
    value: Record<string, unknown>,
    metadata: ArgumentMetadata,
  ): Record<string, unknown> {
    const items: string[] = ['firstName', 'lastName'];
    const errors: string[] = [];
    const farsi = /^[\u0600-\u06FF\s]{2,30}$/;

    for (const key in value) {
      if (items.includes(key)) {
        const fieldValue = value[key];
        if (typeof fieldValue === 'string') {
          const fieldName =
            key === 'firstName'
              ? 'نام'
              : key === 'lastName'
                ? 'نام خانوادگی'
                : key;

          // بررسی طول
          if (fieldValue.length < 2) {
            errors.push(`${fieldName} باید حداقل ۲ کاراکتر باشد`);
          } else if (fieldValue.length > 30) {
            errors.push(`${fieldName} نمی‌تواند بیشتر از ۳۰ کاراکتر باشد`);
          } else {
            // بررسی فقط فارسی
            const isFarsi = farsi.test(fieldValue);
            if (!isFarsi) {
              errors.push(`${fieldName} باید فقط شامل حروف فارسی باشد`);
            }
          }
        }
      }
    }

    if (errors.length) {
      throw new BadRequestException(errors);
    }
    return value;
  }
}
