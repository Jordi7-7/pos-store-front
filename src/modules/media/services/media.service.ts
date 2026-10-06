import { apiClient } from '@/lib/apiClient';

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

export interface RegisteredImage {
  id: string;
  url: string;
  tenantId: string;
  description?: string;
  createdAt: string;
}

export interface PaginatedImages {
  data: RegisteredImage[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const mediaService = {
  getImages: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedImages> => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('search', params.search);

    const queryString = query.toString();
    const endpoint = queryString ? `/media?${queryString}` : '/media';
    return apiClient.get<PaginatedImages>(endpoint);
  },

  getPresignedUrl: async (filename: string, contentType: string): Promise<PresignedUrlResponse> => {
    return apiClient.get<PresignedUrlResponse>(
      `/media/presigned-url?filename=${encodeURIComponent(filename)}&contentType=${encodeURIComponent(contentType)}`
    );
  },

  uploadToR2: async (uploadUrl: string, file: File): Promise<void> => {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file to R2: ${response.statusText}`);
    }
  },

  registerImage: async (url: string, description?: string): Promise<RegisteredImage> => {
    return apiClient.post<RegisteredImage>('/media/register', { url, description });
  },

  uploadImageByUrl: async (url: string, description?: string): Promise<RegisteredImage> => {
    return apiClient.post<RegisteredImage>('/media/upload-by-url', { url, description });
  },

  deleteImage: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/media/${id}`);
  }
};
export default mediaService;
