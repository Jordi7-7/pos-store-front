import { UploadFile } from '../application/use-cases/upload-file';
import { UploadImage } from '../application/use-cases/upload-image';
import { MediaHttpRepository } from './repositories/media.http-repository';

/** Raíz de composición del módulo. */
export const mediaRepository = new MediaHttpRepository();
export const uploadFile = new UploadFile(mediaRepository);
export const uploadImage = new UploadImage(uploadFile, mediaRepository);
