import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class IdPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Debug logs removed - uncomment if needed for debugging
    // console.log('IdPipe value:', value);
    // console.log('IdPipe metadata:', metadata);

    if (metadata.type === 'param' && metadata.data === 'id') {
      if (!isValidObjectId(value)) {
        throw new BadRequestException('فرمت ایدی صحیح نیست');
      }
      return value;
    }
    return value;
  }
}
