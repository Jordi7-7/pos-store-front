import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, FileText, Loader2, Link2, Trash2, Search, X } from 'lucide-react';
import { PaginationControls } from '@/shared/presentation/components/PaginationControls';
import type { RegisteredImage } from '../../domain/entities/media.entity';
import { useConfirm } from '@/shared/presentation/components/useConfirm';

interface MediaViewProps {
  uploadedImages: RegisteredImage[];
  isUploading: boolean;
  isDeleting: boolean;
  isLoading: boolean;
  meta?: { total: number; page: number; limit: number; totalPages: number };
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  search?: string;
  onSearchChange?: (search: string) => void;
  onUpload: (file: File, description: string) => Promise<void>;
  onUploadByUrl: (url: string, description: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const extractImageUrlFromDataTransfer = (dataTransfer: DataTransfer): string | null => {
  // 1. Intentar con text/uri-list (suele contener la URL limpia o una lista de ellas)
  const uriList = dataTransfer.getData('text/uri-list');
  if (uriList) {
    const lines = uriList.split('\n');
    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine && !cleanLine.startsWith('#')) {
        return cleanLine;
      }
    }
  }

  // 2. Intentar con text/plain
  const textPlain = dataTransfer.getData('text/plain');
  if (textPlain) {
    const cleanText = textPlain.trim();
    // Si contiene una redirección de Google Images, ej: https://www.google.com/imgres?imgurl=https%3A%2F%2F...
    if (cleanText.includes('imgurl=')) {
      try {
        const urlObj = new URL(cleanText);
        const imgUrl = urlObj.searchParams.get('imgurl');
        if (imgUrl) return decodeURIComponent(imgUrl);
      } catch {}
    }
    if (cleanText.startsWith('http://') || cleanText.startsWith('https://') || cleanText.startsWith('data:image/')) {
      return cleanText;
    }
  }

  // 3. Intentar con text/html (analizar tags img)
  const htmlData = dataTransfer.getData('text/html');
  if (htmlData) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlData, 'text/html');
      const img = doc.querySelector('img');
      if (img && img.src) {
        return img.src;
      }
    } catch {}
  }

  return null;
};

export const MediaView: React.FC<MediaViewProps> = ({
  uploadedImages,
  isUploading,
  isDeleting,
  isLoading,
  meta,
  onPageChange,
  onLimitChange,
  search = '',
  onSearchChange,
  onUpload,
  onUploadByUrl,
  onDelete
}) => {
  const [description, setDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setSelectedUrl(null);
        setPreviewUrl(URL.createObjectURL(file));
      }
    } else {
      // Usar el extractor robusto de URL
      const url = extractImageUrlFromDataTransfer(e.dataTransfer);
      if (url) {
        setSelectedFile(null);
        setSelectedUrl(url);
        setPreviewUrl(url);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setSelectedUrl(null);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !selectedUrl) return;

    try {
      if (selectedFile) {
        await onUpload(selectedFile, description);
      } else if (selectedUrl) {
        await onUploadByUrl(selectedUrl, description);
      }
      
      // Reset form
      setSelectedFile(null);
      setSelectedUrl(null);
      setPreviewUrl(null);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error al subir la imagen:', error);
    }
  };

  const { confirm, confirmDialog } = useConfirm();

  const handleDelete = async (id: string) => {
    const accepted = await confirm({
      title: 'Eliminar imagen',
      message: 'Se eliminará de la galería y del almacenamiento. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (!accepted) return;

    
    try {
      setDeletingId(id);
      await onDelete(id);
    } catch (error) {
      console.error('Error al eliminar la imagen:', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {confirmDialog}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Side: Images Gallery */}
        <div className="flex-1 bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm">
          <div className="border-b border-border-card pb-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-secondary">Galería de Imágenes</h3>
              <p className="text-xs text-neutral">Imágenes registradas en tu catálogo de productos y galería multimedia.</p>
            </div>
            {onSearchChange && (
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por descripción..."
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-muted/50 border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {search && (
                  <button
                    onClick={() => onSearchChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="h-80 flex flex-col items-center justify-center text-neutral gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-xs">Cargando galería...</span>
            </div>
          ) : uploadedImages.length === 0 ? (
            <div className="h-80 border-2 border-dashed border-border-card rounded-xl flex flex-col items-center justify-center text-neutral gap-2">
              <ImageIcon className="w-12 h-12 opacity-40" />
              <span className="text-xs">
                {search ? 'No se encontraron imágenes con esa descripción.' : 'No hay imágenes en tu galería todavía.'}
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedImages.map((img) => (
                  <div key={img.id} className="bg-bg-dark border border-border-card rounded-xl overflow-hidden shadow-sm flex flex-col justify-between group transition-all duration-200 hover:border-primary/40 hover:shadow-md">
                    <div className="aspect-square relative overflow-hidden bg-slate-100 dark:bg-bg-dark">
                      <img src={img.url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt={img.description || 'galería'} />
                      <div className="absolute right-2 top-2 flex gap-1.5 opacity-100 transition-opacity focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100">
                        <a href={img.url} target="_blank" rel="noopener noreferrer" title="Abrir imagen original" aria-label="Abrir imagen original" className="flex size-8 items-center justify-center rounded-lg bg-white/90 text-secondary shadow-xs transition-colors hover:bg-white">
                          <Link2 className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(img.id)}
                          disabled={isDeleting || deletingId === img.id}
                          className="flex size-8 cursor-pointer items-center justify-center rounded-lg bg-white/90 text-rose-600 shadow-xs transition-colors hover:bg-white disabled:opacity-40"
                          title="Eliminar imagen"
                          aria-label="Eliminar imagen"
                        >
                          {deletingId === img.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-border-card bg-bg-card p-2.5">
                      <p className={`line-clamp-2 min-h-8 text-xs ${img.description ? 'font-medium text-secondary' : 'italic text-muted-foreground'}`} title={img.description || undefined}>
                        {img.description || 'Sin descripción'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {meta && onPageChange && onLimitChange && (
                <PaginationControls
                  meta={meta}
                  onPageChange={onPageChange}
                  onLimitChange={onLimitChange}
                />
              )}
            </div>
          )}
        </div>

        {/* Right Side: Upload Form Widget */}
        <div className="w-full md:w-80 bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm self-start h-auto">
          <div className="border-b border-border-card pb-4 mb-5">
            <h3 className="text-sm font-bold text-secondary">Subir Nueva Imagen</h3>
            <p className="text-xs text-neutral">Sube fotos a la galería de tu tienda.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Drag and Drop Zone */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[140px] ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : previewUrl 
                    ? 'border-border-card bg-bg-dark/20' 
                    : 'border-border-card hover:border-primary/40 hover:bg-primary/5'
              }`}
            >
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                disabled={isUploading}
              />

              {previewUrl ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/10">
                  <img src={previewUrl} className="w-full h-full object-contain" alt="Vista previa" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="text-xs text-white font-semibold">Cambiar imagen</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="mx-auto w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-neutral">
                    <span className="text-primary font-semibold">Haz click para buscar</span> o arrastra tu imagen aquí
                  </div>
                  <div className="text-xs text-neutral/80">Formatos recomendados: PNG, JPG, WEBP</div>
                </div>
              )}
            </div>

            {/* Description Form Field */}
            <div className="space-y-1.5">
 <label className="text-xs font-bold text-neutral flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Descripción de la imagen
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Logo principal de la tienda, Imagen frontal de camisa..."
                disabled={isUploading}
                rows={3}
                className="w-full text-xs bg-bg-dark border border-border-card rounded-xl p-3 text-secondary focus:outline-none focus:border-primary placeholder-neutral transition-all resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={(!selectedFile && !selectedUrl) || isUploading}
              className="w-full bg-primary hover:bg-primary-hover disabled:bg-neutral/20 disabled:text-neutral/60 disabled:cursor-not-allowed text-white text-xs font-bold py-3 px-4 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Subiendo...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Subir Imagen</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default MediaView;
