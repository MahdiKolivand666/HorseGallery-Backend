import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import { UploadFileDto } from './shared/dtos/upload-file.dto';
import { UploadFilesDto } from './shared/dtos/upload-files.dto';
import { ImagesPipe } from './shared/pipes/images.pipe';
import { DeleteFileDto } from './shared/dtos/delete-file.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('health/ready')
  readiness() {
    // Check database connection, external services, etc.
    return {
      status: 'ready',
      checks: {
        database: 'connected',
        // Add more checks as needed
      },
    };
  }

  @Post('upload-file')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile(new ImagesPipe()) file: Express.Multer.File,
    @Body() body: UploadFileDto,
  ) {
    return this.appService.uploadFile(file, body);
  }

  @Post('upload-files')
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadFiles(
    @UploadedFiles(new ImagesPipe()) files: Express.Multer.File[],
    @Body() body: UploadFilesDto,
  ) {
    return this.appService.uploadFiles(files, body);
  }

  @Delete('delete-file')
  deleteFile(@Body() body: DeleteFileDto) {
    return this.appService.deleteFile(body);
  }
}
