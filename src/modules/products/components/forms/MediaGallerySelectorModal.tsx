import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Search, X, Check, Loader2, ImageIcon } from 'lucide-react';
import { mediaService, type RegisteredImage } from '@/modules/media/services/media.service';
import { ProductPagination } from '@/modules/products/components/ProductPagination';

interface MediaGallerySelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedImages: { id: string; url: string; description?: string }[];
  onToggleImage: (image: { id: string; url: string; description?: string }) => void;
  onOpenUploadModal: () => void;
}

export const MediaGallerySelectorModal: React.FC<MediaGallerySelectorModalProps> = ({
  open,
  onOpenChange,
  selectedImages,
  onToggleImage,
  onOpenUploadModal,
}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [images, setImages] = useState<RegisteredImage[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 24, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch images from backend when modal is open, page, limit or search changes
  useEffect(() => {
    if (!open) return;
    let isCancelled = false;

    const fetchGallery = async () => {
      setIsLoading(true);
      try {
        const res = await mediaService.getImages({
          page,
          limit,
          search: debouncedSearch.trim() || undefined,
        });
        if (!isCancelled) {
          setImages(res.data);
          setMeta(res.meta);
        }
      } catch (err) {
        console.error('Error fetching gallery images:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchGallery();
    return () => {
      isCancelled = true;
    };
  }, [open, page, limit, debouncedSearch]);

  const selectedIds = new Set(selectedImages.map((img) => img.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-w-4xl w-[92vw] max-h-[88vh] overflow-hidden flex flex-col gap-0 p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pr-6">
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                Seleccionar de la Galería Multimedia
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Haz click en las imágenes para asociarlas o desasociarlas de este producto. ({selectedImages.length} seleccionadas)
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onOpenUploadModal();
              }}
              className="text-xs shrink-0"
            >
              + Subir Nueva Imagen
            </Button>
          </div>

          {/* Search bar */}
          <div className="relative mt-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-muted/50 border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <span className="text-xs">Cargando imágenes de la galería...</span>
            </div>
          ) : images.length === 0 ? (
            <div className="h-64 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground gap-2">
              <ImageIcon className="w-10 h-10 opacity-40" />
              <span className="text-xs">
                {search ? 'No se encontraron imágenes que coincidan con la búsqueda.' : 'No hay imágenes en la galería.'}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {images.map((img) => {
                const isSelected = selectedIds.has(img.id);
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => onToggleImage({ id: img.id, url: img.url, description: img.description })}
                    className={`group relative aspect-square rounded-xl border-2 overflow-hidden flex flex-col justify-end text-left transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/30 shadow-md scale-95'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={img.url}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      alt={img.description || 'galería'}
                    />

                    {/* Overlay badge with check */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Bottom description gradient */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 pt-4">
                      <p className="text-[10px] text-white font-medium truncate" title={img.description}>
                        {img.description || 'Sin descripción'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with pagination */}
        <div className="px-6 py-3 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="w-full sm:w-auto">
            <ProductPagination
              meta={meta}
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs shrink-0"
          >
            Listo ({selectedImages.length} seleccionadas)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
