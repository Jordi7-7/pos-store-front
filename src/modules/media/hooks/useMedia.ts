import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '../services/media.service';
import type { RegisteredImage, PaginatedImages } from '../services/media.service';

interface UseMediaUploadOptions {
  enabled?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export const useMediaUpload = (options?: UseMediaUploadOptions) => {
  const queryClient = useQueryClient();
  const page = options?.page;
  const limit = options?.limit;
  const search = options?.search;

  // Query to get images from DB
  const { data: response, isLoading } = useQuery<PaginatedImages>({
    queryKey: ['media-images', { page, limit, search }],
    queryFn: () => mediaService.getImages({ page, limit, search }),
    enabled: options?.enabled ?? true,
  });

  const uploadedImages = response?.data || [];
  const meta = response?.meta || { total: 0, page: 1, limit: limit || 20, totalPages: 1 };

  // Mutation to upload a new image
  const uploadMutation = useMutation({
    mutationFn: async ({ file, description }: { file: File; description?: string }): Promise<RegisteredImage> => {
      // 1. Get presigned url
      const { uploadUrl, fileUrl } = await mediaService.getPresignedUrl(file.name, file.type);
      
      // 2. Upload file directly to R2
      await mediaService.uploadToR2(uploadUrl, file);

      // 3. Register image in DB with description
      const registered = await mediaService.registerImage(fileUrl, description);
      
      return registered;
    },
    onSuccess: () => {
      // Invalidate query to refresh gallery automatically
      queryClient.invalidateQueries({ queryKey: ['media-images'] });
    }
  });

  // Mutation to delete an image
  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await mediaService.deleteImage(id);
    },
    onSuccess: () => {
      // Invalidate query to refresh gallery automatically
      queryClient.invalidateQueries({ queryKey: ['media-images'] });
    }
  });

  // Mutation to upload image by URL
  const uploadByUrlMutation = useMutation({
    mutationFn: async ({ url, description }: { url: string; description?: string }): Promise<RegisteredImage> => {
      return mediaService.uploadImageByUrl(url, description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-images'] });
    }
  });

  return {
    uploadImage: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadImageByUrl: uploadByUrlMutation.mutateAsync,
    isUploadingByUrl: uploadByUrlMutation.isPending,
    deleteImage: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    isLoading,
    uploadedImages,
    meta,
  };
};
