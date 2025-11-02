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
    const farsi = /^[\u0600-\u06FF\s]{2,}$/;

    for (const key in value) {
      if (items.includes(key)) {
        const fieldValue = value[key];
        if (typeof fieldValue === 'string') {
          const isFarsi = farsi.test(fieldValue);

          if (!isFarsi) {
            errors.push(`${key} را فارسی وارد نمایید`);
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
