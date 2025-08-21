import sharp from 'sharp';
import * as mkdirp from 'mkdirp';
import { uploadFilesDto } from '../dtos/upload-files.dto';
import { UploadFileDto } from '../dtos/upload-file.dto';
import * as fs from 'fs';

export const saveImages = async (
  files: Array<Express.Multer.File>,
  body: uploadFilesDto,
) => {
  const destination = 'files/' + body.folder;
  mkdirp.sync(destination + '/main');
  mkdirp.sync(destination + '/resized');

  const fileNames: string[] = [];
  // eslint-disable-next-line @typescript-eslint/await-thenable
  for await (const file of files) {
    const fileName =
      new Date().toISOString() +
      '-' +
      file.originalname.split('.')[0] +
      '.webp';

    await sharp(file.buffer)
      .webp()
      .toFile(destination + '/main/' + fileName);

    await sharp(file.buffer)
      .webp()
      .resize({ width: body.width || 200, height: body.height || 200 })
      .toFile(destination + '/resized/' + fileName);

    fileNames.push(fileName);
  }
  return fileNames;
};

export const deleteImages = async (fileName: string, folder: string) => {
  const imagePath = 'files/' + folder;

  try {
    await fs.promises.unlink(`${imagePath}/main/${fileName}`);
    await fs.promises.unlink(`${imagePath}/resized/${fileName}`);
    return { success: true, message: 'Images deleted successfully' };
  } catch (error) {
    console.log('Error deleting images:', error);
    throw new Error(`Failed to delete images: ${error.message}`);
  }
};

export const saveImage = async (
  file: Express.Multer.File,
  body: UploadFileDto,
) => {
  const destination = 'files/' + body.folder;
  mkdirp.sync(destination + '/main');
  mkdirp.sync(destination + '/resized');

  const fileName =
    new Date().toISOString() + '-' + file.originalname.split('.')[0] + '.webp';

  await sharp(file.buffer)
    .webp()
    .toFile(destination + '/main/' + fileName);

  await sharp(file.buffer)
    .webp()
    .resize({ width: body.width || 200, height: body.height || 200 })
    .toFile(destination + '/resized/' + fileName);

  return {
    fileName,
    mainPath: destination + '/main/' + fileName,
    resizedPath: destination + '/resized/' + fileName,
  };
};
