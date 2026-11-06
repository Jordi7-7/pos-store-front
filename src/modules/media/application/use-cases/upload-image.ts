import type { RegisteredImage } from '../../domain/entities/media.entity';
import type { MediaRepository } from '../ports/media.repository';
import type { UploadFile } from './upload-file';

/** Sube una imagen y la registra en la galería con su descripción. */
export class UploadImage {
  constructor(
    private readonly uploadFile: Pick<UploadFile, 'execute'>,
    private readonly repository: Pick<MediaRepository, 'register'>,
  ) {}

  async execute(input: { file: File; description?: string }): Promise<RegisteredImage> {
    const fileUrl = await this.uploadFile.execute(input.file);
    return this.repository.register(fileUrl, input.description);
  }
}
