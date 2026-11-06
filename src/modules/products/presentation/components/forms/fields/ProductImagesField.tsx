import React from 'react';
import { ImageIcon, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProductImagesFieldProps {
  selectedImages: { id: string; url: string; description?: string }[];
  onRemoveImage: (id: string) => void;
  onOpenGalleryModal: () => void;
  onOpenUploadModal: () => void;
}

/** Imágenes elegidas del producto (la primera es la principal), con acceso a la galería y a la subida. */
export const ProductImagesField: React.FC<ProductImagesFieldProps> = ({ selectedImages, onRemoveImage, onOpenGalleryModal, onOpenUploadModal }) => (
  <div className="border-t border-border/40 pt-3 space-y-2.5">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
          Imágenes del Producto{' '}
          <span className="text-muted-foreground font-normal">({selectedImages.length})</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenGalleryModal}
          className="text-xs h-7 px-2.5 gap-1.5"
        >
          <ImageIcon className="w-3.5 h-3.5 text-primary" />
          Seleccionar de la Galería
        </Button>
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={onOpenUploadModal}
          className="text-[11px] h-auto p-0 gap-1 text-primary"
        >
          <Upload className="w-3.5 h-3.5" />
          + Subir Nueva Imagen
        </Button>
      </div>
    </div>

    {selectedImages.length > 0 ? (
      <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-1 border border-border/50 rounded-xl p-2.5 bg-muted/10">
        {selectedImages.map((img, index) => (
          <div
            key={img.id}
            className="group relative w-16 h-16 rounded-xl border border-border overflow-hidden shrink-0 shadow-xs bg-background"
            title={img.description || 'Imagen del producto'}
          >
            <img
              src={img.url}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              alt={img.description || 'producto'}
            />

            {index === 0 && (
              <span className="absolute bottom-0 inset-x-0 bg-primary/90 text-primary-foreground text-[8px] font-semibold text-center py-0.5 leading-none">
                Principal
              </span>
            )}

            {/* Remove button */}
            <button
              type="button"
              onClick={() => onRemoveImage(img.id)}
              className="absolute top-1 right-1 w-4.5 h-4.5 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-sm"
              title="Quitar imagen"
            >
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>
        ))}
      </div>
    ) : (
      <div
        onClick={onOpenGalleryModal}
        className="h-16 border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl flex items-center justify-center gap-2 text-muted-foreground text-xs cursor-pointer transition-all"
      >
        <ImageIcon className="w-4 h-4 text-muted-foreground/60" />
        <span>Este producto aún no tiene imágenes. Haz click para <strong>Seleccionar de la Galería</strong></span>
      </div>
    )}
  </div>
);
