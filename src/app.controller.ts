// AppController handles three main file operations:
// 1. Upload a single file with size and type validation
// 2. Upload multiple files with validation through Pipe
// 3. Delete a file from the server
//
// Request flow:
// Client → Controller → Interceptor (FileInterceptor/FilesInterceptor)
// → Pipe (ParseFilePipe/ImagesPipe for validation) → Service/Utils (saveImage/saveImages)
// → Response (success/error)

import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UploadFileDto } from './shared/dtos/upload-file.dto';
import { saveImages, saveImage, deleteImages } from './shared/utils/file-utils';
import { uploadFilesDto } from './shared/dtos/upload-files.dto';
import { DeleteFileDto } from './shared/dtos/delete-file.dto';
import { ImagesPipe } from './shared/pipes/images.pipe';
import { JwtGuard } from './shared/guards/jwt.guard';

// Swagger documentation tag for shared endpoints
@ApiTags('shared')
@Controller()
// JWT Guard is active on all endpoints - users need valid token to access
@UseGuards(JwtGuard)
// Swagger documentation indicates this controller requires Bearer token
@ApiBearerAuth()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // POST endpoint for uploading a single file
  @Post('upload-file')
  // Indicates the API consumes multipart/form-data
  @ApiConsumes('multipart/form-data')
  // FileInterceptor uses multer to handle file upload
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    // Validates and receives the uploaded file
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2000000 }),
          new FileTypeValidator({
            fileType:
              /(image\/jpeg|image\/png|image\/jpg|image\/svg|image\/webp)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: UploadFileDto,
  ) {
    return saveImage(file, body);
  }

  @Post('upload-files')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files'))
  uploadFiles(
    @UploadedFiles(ImagesPipe) files: Array<Express.Multer.File>,
    @Body() body: uploadFilesDto,
  ) {
    return saveImages(files, body);
  }

  @Delete('delete-file')
  deleteFile(@Body() body: DeleteFileDto) {
    if (!body.fileName || !body.folder) {
      throw new Error('fileName and folder are required');
    }
    return deleteImages(body.fileName, body.folder);
  }
}
