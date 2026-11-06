import type { MediaRepository } from '../ports/media.repository';

/** Sube un archivo al almacenamiento y devuelve su URL pública (sin registrarlo en la galería). */
export class UploadFile {
  constructor(private readonly repository: Pick<MediaRepository, 'getPresignedUpload' | 'putFile'>) {}

  async execute(file: File): Promise<string> {
    const { uploadUrl, fileUrl } = await this.repository.getPresignedUpload(file.name, file.type);
    await this.repository.putFile(uploadUrl, file);
    return fileUrl;
  }
}
