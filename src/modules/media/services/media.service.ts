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

export const mediaService = {
  getImages: async (): Promise<RegisteredImage[]> => {
    return apiClient.get<RegisteredImage[]>('/media');
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
  }
};
export default mediaService;
