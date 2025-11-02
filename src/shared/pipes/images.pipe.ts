import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ImagesPipe implements PipeTransform {
  // Security limits
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly MAX_FILES_COUNT = 10; // Maximum number of files in array
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  // More comprehensive image extensions check
  private readonly ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

  transform(files: Array<Express.Multer.File>) {
    // Check array length
    if (files.length === 0) {
      throw new BadRequestException('لطفاً حداقل یک تصویر آپلود کنید');
    }

    if (files.length > this.MAX_FILES_COUNT) {
      throw new BadRequestException(
        `حداکثر ${this.MAX_FILES_COUNT} تصویر مجاز است`,
      );
    }

    // Validate each file
    for (const file of files) {
      this.validateFile(file);
    }

    return files;
  }

  private validateFile(file: Express.Multer.File): void {
    // Check file existence
    if (!file) {
      throw new BadRequestException('فایل نامعتبر است');
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `حجم فایل نباید بیشتر از ${this.MAX_FILE_SIZE / (1024 * 1024)} مگابایت باشد`,
      );
    }

    // Check MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'فرمت فایل نامعتبر است. فقط فرمت‌های JPG, PNG و WEBP مجاز هستند',
      );
    }

    // Additional security: Check file extension
    const fileExtension = file.originalname
      .toLowerCase()
      .substring(file.originalname.lastIndexOf('.'));

    if (!this.ALLOWED_EXTENSIONS.includes(fileExtension)) {
      throw new BadRequestException(
        'پسوند فایل نامعتبر است. فقط jpg, png و webp مجاز هستند',
      );
    }

    // Check if originalname contains suspicious characters
    // eslint-disable-next-line no-control-regex
    if (/[<>:"/\\|?*\x00-\x1f]/g.test(file.originalname)) {
      throw new BadRequestException('نام فایل حاوی کاراکترهای غیرمجاز است');
    }

    // Check for double extensions (file.jpg.exe)
    const extensionCount = (file.originalname.match(/\./g) || []).length;
    if (extensionCount > 1) {
      throw new BadRequestException('نام فایل نامعتبر است');
    }
  }
}
