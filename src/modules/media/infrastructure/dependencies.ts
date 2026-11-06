import { UploadFile } from '../application/upload-file';
import { UploadImage } from '../application/upload-image';
import { MediaHttpRepository } from './media.http-repository';

/** Raíz de composición del módulo. */
export const mediaRepository = new MediaHttpRepository();
export const uploadFile = new UploadFile(mediaRepository);
export const uploadImage = new UploadImage(uploadFile, mediaRepository);
