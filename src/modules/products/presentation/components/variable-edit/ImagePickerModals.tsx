import React from 'react';
import type { ImagePicker } from '../../hooks/useImagePicker';
import { ImageUploadModal } from '../forms/ImageUploadModal';
import { MediaGallerySelectorModal } from '../forms/MediaGallerySelectorModal';

/** Galería y subida de imágenes del editor; entregan lo elegido al destino (padre o variante) que decide el `picker`. */
export const ImagePickerModals: React.FC<{ picker: ImagePicker }> = ({ picker }) => (
  <>
    <MediaGallerySelectorModal
      open={picker.isGalleryOpen}
      onOpenChange={picker.setIsGalleryOpen}
      selectedImages={picker.targetImages}
      onToggleImage={picker.toggle}
      onOpenUploadModal={picker.openUpload}
    />
    <ImageUploadModal
      open={picker.isUploadOpen}
      onOpenChange={picker.setIsUploadOpen}
      onImageSaved={(saved) => picker.add(typeof saved === 'string' ? { id: saved, url: '' } : saved)}
    />
  </>
);
