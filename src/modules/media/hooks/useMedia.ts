import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '../services/media.service';
import type { RegisteredImage } from '../services/media.service';

export const useMediaUpload = () => {
  const queryClient = useQueryClient();

  // Query to get all images from DB
  const { data: uploadedImages = [], isLoading } = useQuery<RegisteredImage[]>({
    queryKey: ['media-images'],
    queryFn: () => mediaService.getImages(),
  });

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
  };
};
