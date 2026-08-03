import React, { useState, useRef } from 'react';
import { Tag, Check, Upload, Loader2, X, Plus } from 'lucide-react';
import { useMediaUpload } from '../../media/hooks/useMedia';
import { useCategories } from '../hooks/useCategories';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';




interface ProductCreateTabProps {
  categories: any[];
  uploadedImages: any[];
  selectedBranchId: string;
  createSimpleProduct: (input: any) => Promise<any>;
  onSuccess: () => void;
}

const extractImageUrlFromDataTransfer = (dataTransfer: DataTransfer): string | null => {
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
    if (cleanText.startsWith('http://') || cleanText.startsWith('https://') || cleanText.startsWith('data:image/')) {
      return cleanText;
    }
  }

  const htmlData = dataTransfer.getData('text/html');
  if (htmlData) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlData, 'text/html');
      const img = doc.querySelector('img');
      if (img && img.src) {
        return img.src;
      }
    } catch (e) {}
  }

  return null;
};

export const ProductCreateTab: React.FC<ProductCreateTabProps> = ({
  categories,
  uploadedImages,
  selectedBranchId,
  createSimpleProduct,
  onSuccess
}) => {
  const { uploadImage, uploadImageByUrl, isUploading: isUploadingMedia } = useMediaUpload();
  const { createCategory, isCreating: isCreatingCategory } = useCategories();

  // Inline Category states
  const [isCreatingCategoryInline, setIsCreatingCategoryInline] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreateCategoryInline = async () => {
    if (!newCategoryName.trim()) {
      toast.warning('Por favor ingresa un nombre para la categoría.');
      return;
    }
    try {
      const newCat = await createCategory(newCategoryName.trim());
      setProdCategory(newCat.id);
      setNewCategoryName('');
      setIsCreatingCategoryInline(false);
      toast.success('¡Categoría creada e incorporada al producto!');
    } catch (e: any) {
      toast.error(e.message || 'Error al crear la categoría.');
    }
  };


  // Core Product States
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Simple Product Fields (SKU and Barcode are unified)
  const [singleCode, setSingleCode] = useState('');
  const [singlePurchasePrice, setSinglePurchasePrice] = useState('10.00');
  const [singleSalePrice, setSingleSalePrice] = useState('19.99');
  const [singleInitialStock, setSingleInitialStock] = useState('50');

  // Drag and drop for quick upload modal
  const [dragActiveQuick, setDragActiveQuick] = useState(false);
  const [quickUploadUrl, setQuickUploadUrl] = useState<string | null>(null);

  // Quick Upload Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [quickUploadDesc, setQuickUploadDesc] = useState('');
  const [quickUploadFile, setQuickUploadFile] = useState<File | null>(null);
  const [quickUploadPreview, setQuickUploadPreview] = useState<string | null>(null);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  const handleToggleImageSelection = (imageId: string) => {
    if (selectedImages.includes(imageId)) {
      setSelectedImages(selectedImages.filter(id => id !== imageId));
    } else {
      setSelectedImages([...selectedImages, imageId]);
    }
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      toast.error('El nombre del producto es requerido.');
      return;
    }
    if (!singleCode.trim()) {
      toast.error('Por favor ingresa el código SKU/Barras para el producto.');
      return;
    }

    try {
      const categoryId = prodCategory || undefined;

      await createSimpleProduct({
        name: prodName.trim(),
        description: prodDesc.trim(),
        categoryId,
        imageIds: selectedImages,
        sku: singleCode.trim(),
        barcode: singleCode.trim(), // SKU and Barcode are the same
        purchasePrice: parseFloat(singlePurchasePrice) || 0,
        salePrice: parseFloat(singleSalePrice) || 0,
        stocks: selectedBranchId ? [{
          branchId: selectedBranchId,
          quantity: parseInt(singleInitialStock) || 0
        }] : []
      });

      toast.success('¡Producto e inventario registrados con éxito!');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al registrar el producto en el servidor.');
    }
  };

  const handleQuickFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setQuickUploadFile(file);
      setQuickUploadUrl(null);
      setQuickUploadPreview(URL.createObjectURL(file));
    }
  };

  const handleDragQuick = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActiveQuick(true);
    } else if (e.type === "dragleave") {
      setDragActiveQuick(false);
    }
  };

  const handleDropQuick = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveQuick(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setQuickUploadFile(file);
        setQuickUploadUrl(null);
        setQuickUploadPreview(URL.createObjectURL(file));
      }
    } else {
      const url = extractImageUrlFromDataTransfer(e.dataTransfer);
      if (url) {
        setQuickUploadFile(null);
        setQuickUploadUrl(url);
        setQuickUploadPreview(url);
      }
    }
  };

  const handleSaveQuickImage = async () => {
    if (!quickUploadFile && !quickUploadUrl) {
      toast.warning('Por favor selecciona un archivo o arrastra una imagen.');
      return;
    }

    try {
      let savedImage: any;
      if (quickUploadFile) {
        savedImage = await uploadImage({
          file: quickUploadFile,
          description: quickUploadDesc.trim() || 'Imagen rápida de producto',
        });
      } else if (quickUploadUrl) {
        savedImage = await uploadImageByUrl({
          url: quickUploadUrl,
          description: quickUploadDesc.trim() || 'Imagen rápida por URL',
        });
      }

      setSelectedImages([...selectedImages, savedImage.id]);

      // Reset modal state
      setQuickUploadFile(null);
      setQuickUploadUrl(null);
      setQuickUploadPreview(null);
      setQuickUploadDesc('');
      setIsUploadModalOpen(false);
      toast.success('¡Nueva imagen asociada con éxito!');
    } catch (error) {
      console.error('Error al subir la imagen en modal rápido:', error);
      toast.error('Error al procesar la imagen.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative">
      <div className="space-y-6">
        <form onSubmit={handleCreateProductSubmit} className="bg-bg-card border border-border-card rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="border-b border-border-card pb-3">
            <h4 className="text-xs font-bold text-secondary uppercase tracking-wide">Ficha del Producto</h4>
            <p className="text-xs text-neutral mt-0.5">Información base de catalogación general y de inventario.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] text-neutral font-bold uppercase tracking-wider mb-1">Nombre del Producto *</label>
              <input 
                type="text" 
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="Ej. Coca Cola 500ml" 
                className="w-full bg-bg-dark border border-border-card rounded-xl py-2.5 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary" 
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-[10px] text-neutral font-bold uppercase tracking-wider mb-1">Descripción</label>
              <textarea 
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
                placeholder="Ingresa los detalles técnicos, composición, etc." 
                className="w-full bg-bg-dark border border-border-card rounded-xl py-2.5 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary h-20 resize-none" 
              />
            </div>

            <div className="col-span-2 space-y-2">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-[10px] text-neutral font-bold uppercase tracking-wider mb-1">Categoría</label>
                  <Select
                    value={prodCategory || 'none'}
                    onValueChange={(val: string | null) => setProdCategory(val === 'none' || !val ? '' : val)}
                  >
                    <SelectTrigger className="w-full bg-bg-dark border border-border-card rounded-xl py-2.5 px-3.5 text-xs text-secondary text-left focus:outline-none focus:border-primary">
                      <SelectValue placeholder="Ninguna (Opcional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-bg-card border border-border-card text-secondary">
                      <SelectItem value="none">Ninguna (Opcional)</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingCategoryInline(!isCreatingCategoryInline)}
                  className="p-2.5 bg-bg-dark hover:bg-bg-dark/85 border border-border-card rounded-xl text-primary hover:text-primary-hover flex items-center justify-center h-[38px] w-[38px]"
                  title="Crear Nueva Categoría"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>


              {isCreatingCategoryInline && (
                <div className="bg-bg-dark/30 border border-border-card/60 rounded-xl p-3 space-y-2 animate-fade-in">
                  <label className="block text-[9px] text-neutral font-bold uppercase tracking-wider">Nombre de Nueva Categoría</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ej. Bebidas, Snacks"
                      className="flex-1 bg-bg-dark border border-border-card rounded-lg py-1.5 px-2.5 text-xs text-secondary focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategoryInline}
                      disabled={isCreatingCategory}
                      className="py-1.5 px-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isCreatingCategory && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>Crear</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Associated Images Selection */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[10px] text-neutral font-bold uppercase tracking-wider">Asociar Imágenes de la Galería ({selectedImages.length} seleccionadas)</label>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>+ Subir Nueva Imagen</span>
              </button>
            </div>

            {uploadedImages.length > 0 ? (
              <div className="flex gap-2.5 overflow-x-auto pb-1.5 border border-border-card/50 rounded-xl p-3 bg-bg-dark/20">
                {uploadedImages.map((img) => {
                  const isSelected = selectedImages.includes(img.id);
                  return (
                    <div 
                      key={img.id}
                      onClick={() => handleToggleImageSelection(img.id)}
                      className={`relative w-14 h-14 rounded-lg border-2 overflow-hidden cursor-pointer shrink-0 transition-all ${
                        isSelected ? 'border-primary scale-95 shadow-md shadow-primary/20' : 'border-border-card opacity-70 hover:opacity-100'
                      }`}
                      title={img.description}
                    >
                      <img src={img.url} className="w-full h-full object-cover" alt={img.description} />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white font-bold" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-16 border border-dashed border-border-card rounded-xl flex items-center justify-center text-neutral text-[10px]">
                No tienes imágenes subidas aún. Haz click en "+ Subir Nueva Imagen" para agregar una.
              </div>
            )}
          </div>

          {/* Single Product standard fields */}
          <div className="pt-4 border-t border-border-card/50 space-y-4">
            <h5 className="text-[11px] font-bold text-secondary uppercase tracking-wider">Detalles de Precio e Inventario</h5>
            
            <div className="grid grid-cols-2 gap-3.5">
              <div className="col-span-2">
                <label className="block text-[10px] text-neutral mb-1">Código (SKU / Barras) *</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral" />
                  <input 
                    type="text" 
                    required
                    value={singleCode}
                    onChange={(e) => setSingleCode(e.target.value)}
                    placeholder="Escribe el código SKU o de Barras" 
                    className="w-full bg-bg-dark border border-border-card rounded-xl py-2 pl-9 pr-3 text-xs text-secondary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-neutral mb-1">Precio Compra ($) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={singlePurchasePrice}
                  onChange={(e) => setSinglePurchasePrice(e.target.value)}
                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral mb-1">Precio Venta ($) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={singleSalePrice}
                  onChange={(e) => setSingleSalePrice(e.target.value)}
                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] text-neutral mb-1">Stock Inicial *</label>
                <input 
                  type="number" 
                  required
                  value={singleInitialStock}
                  onChange={(e) => setSingleInitialStock(e.target.value)}
                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>Crear Producto e Inventario</span>
          </button>
        </form>
      </div>

      {/* QUICK UPLOAD MEDIA MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-card rounded-2xl w-full max-w-md p-5 shadow-2xl relative animate-scale-up">
            <button 
              onClick={() => {
                setIsUploadModalOpen(false);
                setQuickUploadPreview(null);
                setQuickUploadFile(null);
                setQuickUploadUrl(null);
              }}
              className="absolute right-4 top-4 text-neutral hover:text-secondary"
            >
              <X className="w-4 h-4" />
            </button>

            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">Subir Nueva Imagen</h4>
            <p className="text-[10px] text-neutral mb-4">Arrastra una imagen de internet, selecciona un archivo o pega una URL.</p>

            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div 
                onDragEnter={handleDragQuick}
                onDragOver={handleDragQuick}
                onDragLeave={handleDragQuick}
                onDrop={handleDropQuick}
                onClick={() => quickFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  dragActiveQuick ? 'border-primary bg-primary/5' : 'border-border-card hover:border-neutral/35'
                }`}
              >
                <input 
                  ref={quickFileInputRef}
                  type="file" 
                  accept="image/*"
                  onChange={handleQuickFileChange}
                  className="hidden" 
                />
                
                {quickUploadPreview ? (
                  <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-border-card bg-bg-dark">
                    <img src={quickUploadPreview} className="w-full h-full object-cover" alt="Vista previa rápida" />
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-neutral" />
                    <span className="text-[10px] text-secondary font-semibold">Haz click para seleccionar o arrastra una imagen</span>
                    <span className="text-[9px] text-neutral">Formatos aceptados: PNG, JPG, WebP o URL directa</span>
                  </>
                )}
              </div>

              {/* URL Input */}
              <div className="space-y-1">
                <label className="block text-[9px] text-neutral uppercase tracking-wider">O Pega una URL de Imagen Directa</label>
                <input 
                  type="text" 
                  value={quickUploadUrl || ''}
                  onChange={(e) => {
                    setQuickUploadUrl(e.target.value);
                    setQuickUploadFile(null);
                    setQuickUploadPreview(e.target.value || null);
                  }}
                  placeholder="https://ejemplo.com/imagen.jpg" 
                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-[10px] text-secondary placeholder-gray-400 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Description Input */}
              <div className="space-y-1">
                <label className="block text-[9px] text-neutral uppercase tracking-wider">Descripción o Etiqueta</label>
                <input 
                  type="text" 
                  value={quickUploadDesc}
                  onChange={(e) => setQuickUploadDesc(e.target.value)}
                  placeholder="Ej. Vista Frontal, Coca Cola" 
                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-[10px] text-secondary placeholder-gray-400 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setQuickUploadPreview(null);
                    setQuickUploadFile(null);
                    setQuickUploadUrl(null);
                  }}
                  className="flex-1 py-2 bg-bg-dark hover:bg-bg-dark/80 border border-border-card text-neutral text-[10px] font-bold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveQuickImage}
                  disabled={isUploadingMedia}
                  className="flex-1 py-2 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  {isUploadingMedia && <Loader2 className="w-3 h-3 animate-spin" />}
                  <span>Subir Imagen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProductCreateTab;
