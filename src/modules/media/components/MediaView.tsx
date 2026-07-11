import React from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface MediaViewProps {
  uploadedImages: any[];
  isUploading: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export const MediaView: React.FC<MediaViewProps> = ({
  uploadedImages,
  isUploading,
  handleFileUpload
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-card pb-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-secondary">Galería Multimedia</h3>
            <p className="text-xs text-neutral">Administra y sube tus imágenes directamente a Cloudflare R2.</p>
          </div>
          
          {/* File Upload Button */}
          <div className="relative bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Subiendo archivo...' : 'Subir Nueva Imagen'}</span>
            <input 
              type="file" 
              disabled={isUploading}
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:pointer-events-none" 
            />
          </div>
        </div>

        {uploadedImages.length === 0 ? (
          <div className="h-60 border-2 border-dashed border-border-card rounded-xl flex flex-col items-center justify-center text-neutral gap-2">
            <ImageIcon className="w-12 h-12 opacity-50" />
            <span className="text-xs">No hay imágenes en tu galería todavía.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {uploadedImages.map((img) => (
              <div key={img.id} className="bg-bg-dark border border-border-card rounded-xl overflow-hidden shadow-sm flex flex-col justify-between group">
                <div className="aspect-square relative overflow-hidden bg-slate-100">
                  <img src={img.url} className="w-full h-full object-cover" alt="galería" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <span className="text-[10px] text-white font-mono truncate max-w-full px-2">
                      {img.url.split('/').pop()}
                    </span>
                  </div>
                </div>
                <div className="p-2 border-t border-border-card bg-bg-card flex flex-col gap-0.5">
                  <span className="text-[9px] text-neutral truncate">ID: {img.id.substring(0, 8)}...</span>
                  <a 
                    href={img.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[9px] text-primary font-semibold hover:underline block"
                  >
                    Ver original ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default MediaView;
