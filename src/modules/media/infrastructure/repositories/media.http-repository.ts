import { apiClient } from '@/lib/apiClient';
import type { ImagesQuery, MediaRepository } from '../../application/ports/media.repository';
import type { PaginatedImages, PresignedUpload, RegisteredImage } from '../../domain/entities/media.entity';

/** Galería por HTTP y subida directa al almacenamiento. La API ya responde con la forma de la entidad. */
export class MediaHttpRepository implements MediaRepository {
  list(query?: ImagesQuery): Promise<PaginatedImages> {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', query.page.toString());
    if (query?.limit) params.set('limit', query.limit.toString());
    if (query?.search) params.set('search', query.search);
    const queryString = params.toString();
    return apiClient.get<PaginatedImages>(queryString ? `/media?${queryString}` : '/media');
  }

  getPresignedUpload(filename: string, contentType: string): Promise<PresignedUpload> {
    return apiClient.get<PresignedUpload>(`/media/presigned-url?filename=${encodeURIComponent(filename)}&contentType=${encodeURIComponent(contentType)}`);
  }

  async putFile(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
    if (!response.ok) throw new Error(`Failed to upload file to R2: ${response.statusText}`);
  }

  register(url: string, description?: string): Promise<RegisteredImage> {
    return apiClient.post<RegisteredImage>('/media/register', { url, description });
  }

  registerFromUrl(url: string, description?: string): Promise<RegisteredImage> {
    return apiClient.post<RegisteredImage>('/media/upload-by-url', { url, description });
  }

  remove(id: string): Promise<void> {
    return apiClient.delete<void>(`/media/${id}`);
  }
}
