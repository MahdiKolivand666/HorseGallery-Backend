import { Injectable } from '@nestjs/common';
import { Log } from './shared/schemas/log.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { LogDto } from './shared/dtos/log.dto';
import { UploadFileDto } from './shared/dtos/upload-file.dto';
import { UploadFilesDto } from './shared/dtos/upload-files.dto';
import { DeleteFileDto } from './shared/dtos/delete-file.dto';
import { saveImage, saveImages, deleteImages } from './shared/utils/file-utils';

@Injectable()
export class AppService {
  constructor(@InjectModel(Log.name) private readonly logModel: Model<Log>) {}

  async log(body: LogDto) {
    const newLog = new this.logModel(body);
    await newLog.save();
    return newLog;
  }

  async uploadFile(file: Express.Multer.File, body: UploadFileDto) {
    return await saveImage(file, body);
  }

  async uploadFiles(files: Express.Multer.File[], body: UploadFilesDto) {
    return await saveImages(files, body);
  }

  async deleteFile(body: DeleteFileDto) {
    return await deleteImages(body.fileName, body.folder);
  }
}
