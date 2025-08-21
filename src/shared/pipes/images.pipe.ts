import {
  ArgumentMetadata,
  BadRequestException,
  FileTypeValidator,
  Injectable,
  MaxFileSizeValidator,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ImagesPipe implements PipeTransform {
  transform(files: Array<Express.Multer.File>) {
    const sizeValidator = new MaxFileSizeValidator({ maxSize: 2000000 });
    const typeValidator = new FileTypeValidator({
      fileType: /(image\/jpeg|image\/png|image\/jpg|image\/svg|image\/webp)/,
    });
    for (const image of files) {
      if (!sizeValidator.isValid(image)) {
        throw new BadRequestException(`${image.originalname} is too large`);
      }

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      if (!typeValidator.isValid(image)) {
        throw new BadRequestException(`${image.mimetype} is not  acceptable`);
      }
    }
    return files;
  }
}
