import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaRepository, uploadFile, uploadImage } from '../../infrastructure/dependencies';
import type { PaginatedImages, RegisteredImage } from '../../domain/media.entity';

export interface UseMediaUploadOptions {
  enabled?: boolean;
  page?: number;
  limit?: number;
  search?: string;
}

export interface UseMediaUploadReturn {
  uploadImage: (params: { file: File; description?: string }) => Promise<RegisteredImage>;
  isUploading: boolean;
  uploadImageByUrl: (params: { url: string; description?: string }) => Promise<RegisteredImage>;
  isUploadingByUrl: boolean;
  deleteImage: (id: string) => Promise<void>;
  isDeleting: boolean;
  isLoading: boolean;
  uploadedImages: RegisteredImage[];
  meta: PaginatedImages['meta'];
}

export const useMediaUpload = (options?: UseMediaUploadOptions): UseMediaUploadReturn => {
  const queryClient = useQueryClient();
  const page = options?.page;
  const limit = options?.limit;
  const search = options?.search;

  // Query to get images from DB
  const { data: response, isLoading } = useQuery<PaginatedImages>({
    queryKey: ['media-images', { page, limit, search }],
    queryFn: () => mediaRepository.list({ page, limit, search }),
    enabled: options?.enabled ?? true,
  });

  const uploadedImages: RegisteredImage[] = response?.data ?? [];
  const meta: PaginatedImages['meta'] = response?.meta ?? { total: 0, page: 1, limit: limit || 20, totalPages: 1 };

  // Mutation to upload a new image
  const uploadMutation = useMutation({
    mutationFn: (input: { file: File; description?: string }): Promise<RegisteredImage> => uploadImage.execute(input),
    onSuccess: () => {
      // Invalidate query to refresh gallery automatically
      queryClient.invalidateQueries({ queryKey: ['media-images'] });
    }
  });

  // Mutation to delete an image
  const deleteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await mediaRepository.remove(id);
    },
    onSuccess: () => {
      // Invalidate query to refresh gallery automatically
      queryClient.invalidateQueries({ queryKey: ['media-images'] });
    }
  });

  // Mutation to upload image by URL
  const uploadByUrlMutation = useMutation({
    mutationFn: async ({ url, description }: { url: string; description?: string }): Promise<RegisteredImage> => {
      return mediaRepository.registerFromUrl(url, description);
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

/** Sube un archivo al almacenamiento y devuelve su URL pública, sin registrarlo en la galería (p. ej. el logotipo). */
export const useFileUpload = () => ({ uploadFile: (file: File): Promise<string> => uploadFile.execute(file) });
