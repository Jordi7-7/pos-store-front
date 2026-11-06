import type { PaginatedImages, PresignedUpload, RegisteredImage } from '../../domain/media.entity';

export interface ImagesQuery {
  page?: number;
  limit?: number;
  search?: string;
}

/** Puerto de salida: galería de imágenes y almacenamiento de archivos (la implementación va en `infrastructure`). */
export interface MediaRepository {
  list(query?: ImagesQuery): Promise<PaginatedImages>;
  getPresignedUpload(filename: string, contentType: string): Promise<PresignedUpload>;
  /** Sube el archivo a la dirección temporal (directo al almacenamiento, sin pasar por la API). */
  putFile(uploadUrl: string, file: File): Promise<void>;
  register(url: string, description?: string): Promise<RegisteredImage>;
  registerFromUrl(url: string, description?: string): Promise<RegisteredImage>;
  remove(id: string): Promise<void>;
}
