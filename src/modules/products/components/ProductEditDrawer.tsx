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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
      if (img && img.src) return img.src;
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

  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const [singleCode, setSingleCode] = useState('');
  const [singlePurchasePrice, setSinglePurchasePrice] = useState('10.00');
  const [singleSalePrice, setSingleSalePrice] = useState('19.99');
  const [singleInitialStock, setSingleInitialStock] = useState('50');

  const [dragActiveQuick, setDragActiveQuick] = useState(false);
  const [quickUploadUrl, setQuickUploadUrl] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [quickUploadDesc, setQuickUploadDesc] = useState('');
  const [quickUploadFile, setQuickUploadFile] = useState<File | null>(null);
  const [quickUploadPreview, setQuickUploadPreview] = useState<string | null>(null);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

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
      barcode: singleCode.trim(),
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
    if (e.type === "dragenter" || e.type === "dragover") setDragActiveQuick(true);
    else if (e.type === "dragleave") setDragActiveQuick(false);
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
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-background border-l border-border z-[45] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Editar Producto</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Modifica los detalles generales, precios y stock del artículo.</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <form id="edit-product-form" onSubmit={handleSaveProduct} className="space-y-5">

            {/* Product Name */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider">Nombre del Producto *</Label>
              <Input
                type="text"
                required
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                placeholder="Ej. Coca Cola 500ml"
                className="text-xs"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider">Descripción</Label>
              <Textarea
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
                placeholder="Ingresa la descripción del artículo..."
                className="text-xs h-20 resize-none"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider">Categoría</Label>
                  <Combobox
                    value={prodCategory || 'none'}
                    onValueChange={(val) => setProdCategory(val === 'none' || !val ? '' : (val as string))}
                  >
                    <ComboboxInput
                      placeholder="Buscar o seleccionar categoría..."
                      className="text-xs shadow-none"
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
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsCreatingCategoryInline(!isCreatingCategoryInline)}
                  title="Crear Nueva Categoría"
                  className="shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {isCreatingCategoryInline && (
                <div className="bg-muted/30 border border-border/60 rounded-xl p-3 space-y-2">
                  <Label className="text-[9px] uppercase tracking-wider">Nombre de Nueva Categoría</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ej. Bebidas, Snacks"
                      className="flex-1 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCreateCategoryInline}
                      disabled={isCreatingCategory}
                    >
                      {isCreatingCategory && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                      Crear
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Images */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] uppercase tracking-wider">
                  Imágenes de la Galería ({selectedImages.length} seleccionadas)
                </Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="text-[10px] h-auto p-0 gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  + Subir Nueva Imagen
                </Button>
              </div>

              {uploadedImages.length > 0 ? (
                <div className="flex gap-2.5 overflow-x-auto pb-1.5 border border-border/50 rounded-xl p-3 bg-muted/10">
                  {uploadedImages.map((img) => {
                    const isSelected = selectedImages.includes(img.id);
                    return (
                      <div
                        key={img.id}
                        onClick={() => handleToggleImageSelection(img.id)}
                        className={`relative w-14 h-14 rounded-lg border-2 overflow-hidden cursor-pointer shrink-0 transition-all ${
                          isSelected ? 'border-primary scale-95 shadow-md shadow-primary/20' : 'border-border opacity-70 hover:opacity-100'
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
                <div className="h-16 border border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground text-[10px]">
                  No tienes imágenes subidas aún.
                </div>
              )}
            </div>

            <Separator />

            {/* Price & Inventory */}
            <div className="space-y-4">
              <h5 className="text-[11px] font-bold uppercase tracking-wider">Detalles de Precio e Inventario</h5>
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-[10px]">Código (SKU / Barras) *</Label>
                  <Input
                    type="text"
                    required
                    value={singleCode}
                    onChange={(e) => setSingleCode(e.target.value)}
                    placeholder="Código SKU o de Barras"
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px]">Precio Compra ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={singlePurchasePrice}
                    onChange={(e) => setSinglePurchasePrice(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px]">Precio Venta ($) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={singleSalePrice}
                    onChange={(e) => setSingleSalePrice(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label className="text-[10px]">Stock de Sucursal *</Label>
                  <Input
                    type="number"
                    required
                    value={singleInitialStock}
                    onChange={(e) => setSingleInitialStock(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/10 flex justify-between gap-4">
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs"
          >
            Eliminar Producto
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="edit-product-form"
              disabled={isUpdating}
              className="text-xs gap-1.5"
            >
              {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <Save className="w-3.5 h-3.5" />
              Guardar Cambios
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <DialogTitle className="text-sm">¿Estás seguro de eliminar el producto?</DialogTitle>
              <DialogDescription className="text-xs">
                Esta acción es irreversible y eliminará todo el historial de inventario (Kardex) asociado a este artículo.
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex gap-2.5 mt-2">
            <Button
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => setShowDeleteConfirm(false)}
            >
              No, Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1 text-xs"
              onClick={handleDeleteProductSubmit}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Upload Dialog */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Subir Nueva Imagen</DialogTitle>
            <DialogDescription className="text-[10px]">
              Arrastra una imagen de internet, selecciona un archivo o pega una URL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div
              onDragEnter={handleDragQuick}
              onDragOver={handleDragQuick}
              onDragLeave={handleDragQuick}
              onDrop={handleDropQuick}
              onClick={() => quickFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                dragActiveQuick ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'
              }`}
            >
              <input ref={quickFileInputRef} type="file" accept="image/*" onChange={handleQuickFileChange} className="hidden" />
              {quickUploadPreview ? (
                <div className="relative w-28 h-28 rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={quickUploadPreview} className="w-full h-full object-cover" alt="Vista previa rápida" />
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-[10px] font-semibold text-center">Haz click para seleccionar o arrastra una imagen</span>
                  <span className="text-[9px] text-muted-foreground">Formatos aceptados: PNG, JPG, WebP o URL directa</span>
                </>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] uppercase tracking-wider">O Pega una URL de Imagen Directa</Label>
              <Input
                type="text"
                value={quickUploadUrl || ''}
                onChange={(e) => {
                  setQuickUploadUrl(e.target.value);
                  setQuickUploadFile(null);
                  setQuickUploadPreview(e.target.value || null);
                }}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] uppercase tracking-wider">Descripción o Etiqueta</Label>
              <Input
                type="text"
                value={quickUploadDesc}
                onChange={(e) => setQuickUploadDesc(e.target.value)}
                placeholder="Ej. Vista Frontal, Coca Cola"
                className="text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setQuickUploadPreview(null);
                  setQuickUploadFile(null);
                  setQuickUploadUrl(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveQuickImage}
                disabled={isUploadingMedia}
                className="flex-1 text-xs"
              >
                {isUploadingMedia && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                Subir Imagen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default ProductEditDrawer;
