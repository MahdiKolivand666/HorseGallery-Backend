import { Injectable } from '@nestjs/common';
import { Log } from './shared/schemas/log.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { LogDto } from './shared/dtos/log.dto';

@Injectable()
export class AppService {
  constructor(@InjectModel(Log.name) private readonly logModel: Model<Log>) {}

  async log(body: LogDto) {
    const newLog = new this.logModel(body);
    await newLog.save();
    return newLog;
  }
}
