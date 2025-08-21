import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class UrlPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value?.url) {
      const url = /^[a-zA-Z0-9-]+$/;
      const newUrl = value.url.toLowerCase();

      const isValidUrl = url.test(newUrl);
      if (!isValidUrl) {
        throw new BadRequestException('آدرس صفحه صحیح نیست');
      }

      return { ...value, url: newUrl };
    }
    return value;
  }
}
