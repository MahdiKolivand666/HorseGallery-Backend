import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { NewTicketDto } from 'src/ticket/dtos/new-ticket.dto';

@Injectable()
export class TicketMessagePipe implements PipeTransform {
  transform(value: NewTicketDto, metadata: ArgumentMetadata) {
    if (!value.content && !value.image) {
      throw new BadRequestException('هر پیامی باید یک عکس یا متن داشته باشد');
    }

    return value;
  }
}
