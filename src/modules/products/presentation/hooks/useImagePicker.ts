import { useState } from 'react';
import type { EditableVariantRow } from '../../domain/rules/variant-rows';
import type { ImageItem } from './useParentInfoForm';

interface Options {
  parentImages: ImageItem[];
  setParentImages: (images: ImageItem[]) => void;
  rows: EditableVariantRow[];
  setRowImages: (variantId: string, images: ImageItem[]) => void;
}

/**
 * Qué fotos se están eligiendo: las del producto padre o las de una variante concreta. Mantiene el
 * estado de la galería y de la subida, y sabe a quién entregar la imagen elegida o subida.
 */
export function useImagePicker({ parentImages, setParentImages, rows, setRowImages }: Options) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [variantId, setVariantId] = useState<string | null>(null);

  const targetImages: ImageItem[] = variantId ? rows.find((row) => row.id === variantId)?.images ?? [] : parentImages;
  const setTargetImages = (images: ImageItem[]) => (variantId ? setRowImages(variantId, images) : setParentImages(images));

  return {
    isGalleryOpen,
    isUploadOpen,
    targetImages,
    openForParent: () => {
      setVariantId(null);
      setIsGalleryOpen(true);
    },
    openForVariant: (id: string) => {
      setVariantId(id);
      setIsGalleryOpen(true);
    },
    openUpload: () => setIsUploadOpen(true),
    setIsUploadOpen,
    setIsGalleryOpen: (open: boolean) => {
      setIsGalleryOpen(open);
      if (!open) setVariantId(null);
    },
    toggle: (image: ImageItem) =>
      setTargetImages(targetImages.some((item) => item.id === image.id) ? targetImages.filter((item) => item.id !== image.id) : [...targetImages, image]),
    add: (image: ImageItem) => setTargetImages([...targetImages, image]),
    removeParentImage: (id: string) => setParentImages(parentImages.filter((image) => image.id !== id)),
  };
}

export type ImagePicker = ReturnType<typeof useImagePicker>;
