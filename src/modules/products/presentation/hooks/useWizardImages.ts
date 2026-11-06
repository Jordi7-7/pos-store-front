import { useState } from 'react';
import type { WizardImage, WizardVariantRow } from '../../domain/rules/variable-wizard';

type SetRows = (update: (rows: WizardVariantRow[]) => WizardVariantRow[]) => void;

/**
 * Fotos del asistente: las del producto y las de cada variante. Una sola galería y un solo diálogo de subida
 * sirven a los dos; `activeVariantId` indica a quién van las fotos que se elijan (nadie = al producto).
 */
export function useWizardImages(rows: WizardVariantRow[], setRows: SetRows) {
  const [productImages, setProductImages] = useState<WizardImage[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);

  const updateActiveVariant = (change: (images: WizardImage[]) => WizardImage[]) =>
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== activeVariantId) return row;
        const images = change(row.images ?? []);
        return { ...row, images, imageIds: images.map((image) => image.id) };
      }),
    );

  const openGalleryForProduct = () => {
    setActiveVariantId(null);
    setIsGalleryOpen(true);
  };
  const openUploadForProduct = () => {
    setActiveVariantId(null);
    setIsUploadOpen(true);
  };
  const openGalleryForVariant = (variantId: string) => {
    setActiveVariantId(variantId);
    setIsGalleryOpen(true);
  };

  const setGalleryOpen = (open: boolean) => {
    setIsGalleryOpen(open);
    if (!open) setActiveVariantId(null);
  };

  /** Fotos marcadas en la galería: las de la variante activa o las del producto. */
  const selectedInGallery = activeVariantId ? (rows.find((row) => row.id === activeVariantId)?.images ?? []) : productImages;

  const toggleImage = (image: WizardImage) => {
    if (activeVariantId) {
      updateActiveVariant((images) => (images.some((item) => item.id === image.id) ? images.filter((item) => item.id !== image.id) : [...images, image]));
    } else {
      setProductImages((prev) => (prev.some((item) => item.id === image.id) ? prev.filter((item) => item.id !== image.id) : [...prev, image]));
    }
  };

  const addUploaded = (uploaded: string | WizardImage) => {
    const image = typeof uploaded === 'string' ? { id: uploaded, url: '' } : uploaded;
    if (activeVariantId) updateActiveVariant((images) => [...images, image]);
    else setProductImages((prev) => [...prev, image]);
  };

  return {
    productImages,
    removeProductImage: (id: string) => setProductImages((prev) => prev.filter((image) => image.id !== id)),
    isGalleryOpen,
    setGalleryOpen,
    isUploadOpen,
    setUploadOpen: setIsUploadOpen,
    selectedInGallery,
    openGalleryForProduct,
    openUploadForProduct,
    openGalleryForVariant,
    toggleImage,
    addUploaded,
  };
}
