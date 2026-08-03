import React, { useState, useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { useMediaUpload } from '../../../media/hooks/useMedia';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const extractImageUrlFromDataTransfer = (dataTransfer: DataTransfer): string | null => {
  const uriList = dataTransfer.getData('text/uri-list');
  if (uriList) {
    const lines = uriList.split('\n');
    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine && !cleanLine.startsWith('#')) return cleanLine;
    }
  }

  const textPlain = dataTransfer.getData('text/plain');
  if (textPlain) {
    const cleanText = textPlain.trim();
    if (cleanText.includes('imgurl=')) {
      try {
        const urlObj = new URL(cleanText);
        const imgUrl = urlObj.searchParams.get('imgurl');
        if (imgUrl) return decodeURIComponent(imgUrl);
      } catch (e) {}
    }
    if (
      cleanText.startsWith('http://') ||
      cleanText.startsWith('https://') ||
      cleanText.startsWith('data:image/')
    ) {
      return cleanText;
    }
  }

  const htmlData = dataTransfer.getData('text/html');
  if (htmlData) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlData, 'text/html');
      const img = doc.querySelector('img');
      if (img && img.src) return img.src;
    } catch (e) {}
  }

  return null;
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ImageUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the new image id after a successful upload */
  onImageSaved: (imageId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  open,
  onOpenChange,
  onImageSaved,
}) => {
  const { uploadImage, uploadImageByUrl, isUploading } = useMediaUpload();

  const [dragActive, setDragActive] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setDragActive(false);
    setUploadUrl(null);
    setUploadDesc('');
    setUploadFile(null);
    setPreviewUrl(null);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadUrl(null);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setUploadFile(file);
        setUploadUrl(null);
        setPreviewUrl(URL.createObjectURL(file));
      }
    } else {
      const url = extractImageUrlFromDataTransfer(e.dataTransfer);
      if (url) {
        setUploadFile(null);
        setUploadUrl(url);
        setPreviewUrl(url);
      }
    }
  };

  const handleSave = async () => {
    if (!uploadFile && !uploadUrl) {
      toast.warning('Por favor selecciona un archivo o arrastra una imagen.');
      return;
    }
    try {
      let saved: any;
      if (uploadFile) {
        saved = await uploadImage({
          file: uploadFile,
          description: uploadDesc.trim() || 'Imagen rápida de producto',
        });
      } else if (uploadUrl) {
        saved = await uploadImageByUrl({
          url: uploadUrl,
          description: uploadDesc.trim() || 'Imagen rápida por URL',
        });
      }
      onImageSaved(saved.id);
      handleClose();
      toast.success('¡Nueva imagen asociada con éxito!');
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      toast.error('Error al procesar la imagen.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Subir Nueva Imagen</DialogTitle>
          <DialogDescription className="text-xs">
            Arrastra una imagen, selecciona un archivo o pega una URL directa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {previewUrl ? (
              <div className="w-28 h-28 rounded-lg overflow-hidden border border-border bg-muted">
                <img src={previewUrl} className="w-full h-full object-cover" alt="Vista previa" />
              </div>
            ) : (
              <>
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs font-semibold text-center">
                  Haz click o arrastra una imagen aquí
                </span>
                <span className="text-[10px] text-muted-foreground">
                  PNG, JPG, WebP o URL directa
                </span>
              </>
            )}
          </div>

          {/* URL input */}
          <Field>
            <FieldLabel htmlFor="img-modal-url" className="text-[10px]">
              O Pega una URL de Imagen
            </FieldLabel>
            <Input
              id="img-modal-url"
              type="text"
              value={uploadUrl || ''}
              onChange={(e) => {
                setUploadUrl(e.target.value);
                setUploadFile(null);
                setPreviewUrl(e.target.value || null);
              }}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="text-xs"
            />
          </Field>

          {/* Description */}
          <Field>
            <FieldLabel htmlFor="img-modal-desc" className="text-[10px]">
              Descripción o Etiqueta
            </FieldLabel>
            <Input
              id="img-modal-desc"
              type="text"
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              placeholder="Ej. Vista Frontal, Coca Cola"
              className="text-xs"
            />
          </Field>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 text-xs" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isUploading} className="flex-1 text-xs">
              {isUploading && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
              Subir Imagen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadModal;
