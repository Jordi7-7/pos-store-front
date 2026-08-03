import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Upload, Loader2, Save, AlertTriangle, Plus } from 'lucide-react';
import { useMediaUpload } from '../../media/hooks/useMedia';
import { useUpdateProduct, useDeleteProduct } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { toast } from 'sonner';




interface ProductEditDrawerProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  uploadedImages: any[];
  selectedBranchId: string;
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

export const ProductEditDrawer: React.FC<ProductEditDrawerProps> = ({
  product,
  isOpen,
  onClose,
  categories,
  uploadedImages,
  selectedBranchId
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


  const { updateProduct, isUpdating } = useUpdateProduct();
  const { deleteProduct, isDeleting } = useDeleteProduct();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Core Product States
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  // Single Variant (SKU and Barcode are unified)
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

  // Load product data when opened
  useEffect(() => {
    if (product) {
      setProdName(product.name || '');
      setProdDesc(product.description || '');
      setProdCategory(product.categoryId || '');
      const initialImageIds = product.images ? product.images.map((img: any) => img.id) : [];
      setSelectedImages(initialImageIds);
      
      const vList = product.variants || [];
      if (vList.length > 0) {
        const sv = vList[0];
        setSingleCode(sv.sku || sv.barcode || '');
        setSinglePurchasePrice(String(sv.purchasePrice || '0.00'));
        setSingleSalePrice(String(sv.salePrice || '0.00'));
        const stockQty = sv.stocks?.find((s: any) => s.branchId === selectedBranchId)?.quantity || 0;
        setSingleInitialStock(String(stockQty));
      }
    }
  }, [product, selectedBranchId]);

  const handleToggleImageSelection = (imageId: string) => {
    if (selectedImages.includes(imageId)) {
      setSelectedImages(selectedImages.filter(id => id !== imageId));
    } else {
      setSelectedImages([...selectedImages, imageId]);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      toast.error('El nombre del producto es requerido.');
      return;
    }
    if (!singleCode.trim()) {
      toast.error('Por favor ingresa el código para el producto.');
      return;
    }

    const sv = product?.variants?.[0] || {};
    const finalVariants = [{
      id: sv.id,
      sku: singleCode.trim(),
      barcode: singleCode.trim(), // SKU and Barcode unified
      purchasePrice: parseFloat(singlePurchasePrice) || 0,
      salePrice: parseFloat(singleSalePrice) || 0,
      attributeValues: [],
      imageIds: selectedImages,
      stocks: selectedBranchId ? [{
        branchId: selectedBranchId,
        quantity: parseInt(singleInitialStock) || 0
      }] : []
    }];

    try {
      const categoryId = prodCategory || null;
      await updateProduct({
        id: product.id,
        input: {
          name: prodName.trim(),
          description: prodDesc.trim(),
          categoryId: categoryId || undefined,
          imageIds: selectedImages,
          variants: finalVariants
        }
      });

      toast.success('¡Producto actualizado con éxito!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar los cambios en el servidor.');
    }
  };

  const handleDeleteProductSubmit = async () => {
    if (!product) return;
    try {
      await deleteProduct(product.id);
      toast.success('¡Producto eliminado con éxito!');
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error al intentar eliminar el producto.');
    }
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(false);
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

  if (!isOpen || !product) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-bg-card border-l border-border-card z-45 shadow-2xl flex flex-col justify-between animate-slide-left text-secondary">
        
        {/* Header */}
        <div className="p-6 border-b border-border-card flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-secondary">Editar Producto</h3>
            <p className="text-xs text-neutral mt-0.5">Modifica los detalles generales, precios y stock del artículo.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-bg-dark text-neutral hover:text-secondary">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="edit-product-form" onSubmit={handleSaveProduct} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-neutral font-bold uppercase tracking-wider mb-1">Nombre del Producto *</label>
                <input 
                  type="text" 
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Ej. Coca Cola 500ml" 
                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] text-neutral font-bold uppercase tracking-wider mb-1">Descripción</label>
                <textarea 
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Ingresa la descripción del artículo..." 
                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-[10px] text-neutral font-bold uppercase tracking-wider mb-1">Categoría</label>
                  <Combobox
                    value={prodCategory || 'none'}
                    onValueChange={(val) => setProdCategory(val === 'none' || !val ? '' : (val as string))}
                  >
                    <ComboboxInput 
                      placeholder="Buscar o seleccionar categoría..." 
                      className="w-full bg-bg-dark border border-border-card rounded-xl text-xs text-secondary text-left focus:outline-none focus:border-primary shadow-none" 
                      showTrigger={true}
                    />
                    <ComboboxContent>
                      <ComboboxEmpty>No se encontraron categorías.</ComboboxEmpty>
                      <ComboboxList>
                        <ComboboxItem value="none">Ninguna (Opcional)</ComboboxItem>
                        {categories.map((cat) => (
                          <ComboboxItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </ComboboxItem>
                        ))}
                      </ComboboxList>
                    </ComboboxContent>
                  </Combobox>
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
            </div>


            {/* Images selection */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
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
                  No tienes imágenes subidas aún.
                </div>
              )}
            </div>

            {/* Price and Inventory Section */}
            <div className="pt-4 border-t border-border-card/50 space-y-4">
              <h5 className="text-[11px] font-bold text-secondary uppercase tracking-wider">Detalles de Precio e Inventario</h5>
              
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <label className="block text-[10px] text-neutral mb-1">Código (SKU / Barras) *</label>
                  <input 
                    type="text" 
                    required
                    value={singleCode}
                    onChange={(e) => setSingleCode(e.target.value)}
                    placeholder="Código SKU o de Barras" 
                    className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-neutral mb-1">Precio Compra ($) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={singlePurchasePrice}
                    onChange={(e) => setSinglePurchasePrice(e.target.value)}
                    className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary"
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
                    className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] text-neutral mb-1">Stock de Sucursal *</label>
                  <input 
                    type="number" 
                    required
                    value={singleInitialStock}
                    onChange={(e) => setSingleInitialStock(e.target.value)}
                    className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer actions */}
        <div className="p-6 border-t border-border-card bg-bg-dark/20 flex justify-between gap-4">
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => setShowDeleteConfirm(true)}
            className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/40 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            Eliminar Producto
          </button>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 border border-border-card bg-bg-card hover:bg-bg-dark text-neutral text-xs font-bold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="edit-product-form"
              disabled={isUpdating}
              className="py-2.5 px-5 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-card rounded-2xl w-full max-w-sm p-6 shadow-2xl relative animate-scale-up text-secondary">
            <div className="flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-secondary">¿Estás seguro de eliminar el producto?</h4>
                <p className="text-xs text-neutral mt-1">Esta acción es irreversible y eliminará todo el historial de inventario (Kardex) asociado a este artículo.</p>
              </div>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button
                onClick={handleCloseDeleteConfirm}
                className="flex-1 py-2 bg-bg-dark border border-border-card text-neutral text-xs font-bold rounded-xl transition-all"
              >
                No, Cancelar
              </button>
              <button
                onClick={handleDeleteProductSubmit}
                disabled={isDeleting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-600/40 text-white text-xs font-bold rounded-xl transition-all shadow"
              >
                {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK UPLOAD MEDIA MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-card rounded-2xl w-full max-w-md p-5 shadow-2xl relative animate-scale-up text-secondary">
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

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setQuickUploadPreview(null);
                    setQuickUploadFile(null);
                    setQuickUploadUrl(null);
                  }}
                  className="flex-1 py-2 bg-bg-dark border border-border-card text-neutral text-[10px] font-bold rounded-lg transition-colors"
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
    </>
  );
};
export default ProductEditDrawer;
