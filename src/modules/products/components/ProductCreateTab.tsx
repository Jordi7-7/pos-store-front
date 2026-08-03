import React, { useState, useRef } from 'react';
import { Tag, Check, Upload, Loader2, Plus } from 'lucide-react';
import { useMediaUpload } from '../../media/hooks/useMedia';
import { useCategories } from '../hooks/useCategories';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
        barcode: singleCode.trim(),
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
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Ficha del Producto</CardTitle>
          <CardDescription className="text-xs">Información base de catalogación general y de inventario.</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleCreateProductSubmit} className="space-y-5">
            {/* Product Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
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

              <div className="col-span-2 space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider">Descripción</Label>
                <Textarea
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Ingresa los detalles técnicos, composición, etc."
                  className="text-xs h-20 resize-none"
                />
              </div>

              {/* Category */}
              <div className="col-span-2 space-y-2">
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
                        className="text-xs"
                      >
                        {isCreatingCategory && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                        Crear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Associated Images */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] uppercase tracking-wider">
                  Asociar Imágenes de la Galería ({selectedImages.length} seleccionadas)
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
                  No tienes imágenes subidas aún. Haz click en "+ Subir Nueva Imagen" para agregar una.
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
                  <div className="relative">
                    <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      type="text"
                      required
                      value={singleCode}
                      onChange={(e) => setSingleCode(e.target.value)}
                      placeholder="Escribe el código SKU o de Barras"
                      className="pl-9 text-xs"
                    />
                  </div>
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
                  <Label className="text-[10px]">Stock Inicial *</Label>
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

            <Button type="submit" className="w-full">
              Crear Producto e Inventario
            </Button>
          </form>
        </CardContent>
      </Card>

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
            {/* Drag and Drop Zone */}
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
              <input
                ref={quickFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleQuickFileChange}
                className="hidden"
              />
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
    </div>
  );
};
export default ProductCreateTab;
