// این کنترلر سه بخش داره:

// 📤 آپلود یک فایل با محدودیت حجم و نوع.

// 📂 آپلود چند فایل با اعتبارسنجی از طریق Pipe.

// ❌ حذف فایل از روی سرور.

// steps = [
//     ("Client", "کاربر فایل یا چند فایل رو می‌فرسته"),
//     ("Controller", "AppController متد مربوطه رو صدا می‌زنه"),
//     ("Interceptor", "FileInterceptor / FilesInterceptor فایل رو می‌گیره"),
//     ("Pipe", "ParseFilePipe یا ImagesPipe → اعتبارسنجی (حجم، نوع فایل)"),
//     ("Service/Utils", "saveImage / saveImages → ذخیره روی سرور"),
//     ("Response", "جواب به کاربر برمی‌گرده (موفق/خطا)")
// ]

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

// baraye mostanad sazi swagger k address ro neshon mide k shared ro neshon mide

@ApiTags('shared')
@Controller()
// user guards roye hameye gauardha faal mishe va har user ba user pass va token motabar faghat mitune login kone
@UseGuards(JwtGuard)
// b swagger mige in controller niyaz b brearer token dare hamon JwtGuard.
@ApiBearerAuth()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // address api post mishe upload file
  @Post('upload-file')
  // api consume moshakhas mikone k api file daryaft mikone
  @ApiConsumes('multipart/form-data')
  // useintercoptor ba komake multer file ro migire
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    // file upoladi dar nazar gerefte mishe
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

  // @Delete('delete-image')
  // @ApiOperation({ summary: 'Delete an image' })
  // @ApiQuery({
  //   name: 'fileName',
  //   description: 'Name of the file to delete',
  //   required: true,
  //   type: String,
  // })
  // @ApiQuery({
  //   name: 'folder',
  //   description: 'Folder where the image is stored',
  //   required: true,
  //   type: String,
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Image deleted successfully',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       success: { type: 'boolean', example: true },
  //       message: { type: 'string', example: 'Images deleted successfully' },
  //     },
  //   },
  // })
  // async deleteImage(
  //   @Query('fileName') fileName: string,
  //   @Query('folder') folder: string,
  // ) {
  //   try {
  //     return await deleteImages(fileName, folder);
  //   } catch (error) {
  //     throw new Error(`Failed to delete image: ${error.message}`);
  //   }
  // }
}
