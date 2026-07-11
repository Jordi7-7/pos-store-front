import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { mediaService } from '../services/media.service';
import type { RegisteredImage } from '../services/media.service';

export const useMediaUpload = () => {
  const [uploadedImages, setUploadedImages] = useState<RegisteredImage[]>([]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<RegisteredImage> => {
      // 1. Get presigned url
      const { uploadUrl, fileUrl } = await mediaService.getPresignedUrl(file.name, file.type);
      
      // 2. Upload file directly to R2
      await mediaService.uploadToR2(uploadUrl, file);

      // 3. Register image in DB
      const registered = await mediaService.registerImage(fileUrl);
      
      // Update local session list
      setUploadedImages((prev) => [...prev, registered]);

      return registered;
    }
  });

  return {
    uploadImage: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadedImages,
  };
};
