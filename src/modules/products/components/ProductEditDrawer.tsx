import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, Plus, Trash2, X, Upload, Loader2, Save, AlertTriangle } from 'lucide-react';
import { useAttributes } from '../hooks/useAttributes';
import { useMediaUpload } from '../../media/hooks/useMedia';
import { useUpdateProduct, useDeleteProduct } from '../hooks/useProducts';
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
      } catch (e) {}
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
  const { attributes } = useAttributes();
  const { uploadImage, uploadImageByUrl, isUploading: isUploadingMedia } = useMediaUpload();

  // Drag and drop for quick upload modal
  const [dragActiveQuick, setDragActiveQuick] = useState(false);
  const [quickUploadUrl, setQuickUploadUrl] = useState<string | null>(null);

  const { updateProduct, isUpdating } = useUpdateProduct();
  const { deleteProduct, isDeleting } = useDeleteProduct();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Core Product States
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [hasVariants, setHasVariants] = useState(false);

  // Active Attributes for this product
  const [activeAttributeIds, setActiveAttributeIds] = useState<string[]>([]);
  const [selectedAttributeToAdd, setSelectedAttributeToAdd] = useState('');

  // Single Variant (for product WITHOUT variants)
  const [singleSku, setSingleSku] = useState('');
  const [singleBarcode, setSingleBarcode] = useState('');
  const [singlePurchasePrice, setSinglePurchasePrice] = useState('10.00');
  const [singleSalePrice, setSingleSalePrice] = useState('19.99');
  const [singleInitialStock, setSingleInitialStock] = useState('50');

  // Multiple Variants Builder (for product WITH variants)
  const [variantsList, setVariantsList] = useState<{
    id?: string; // Optional database ID for matching existing
    sku: string;
    barcode: string;
    purchasePrice: number;
    salePrice: number;
    initialStock: number;
    imageIds: string[];
    attributeValues: { attributeValueId: string; attributeName: string; valueText: string }[];
    stocks?: { branchId: string; quantity: number }[];
  }[]>([]);

  // Current Variant Builder Inputs
  const [builderSku, setBuilderSku] = useState('');
  const [builderBarcode, setBuilderBarcode] = useState('');
  const [builderPurchasePrice, setBuilderPurchasePrice] = useState('10.00');
  const [builderSalePrice, setBuilderSalePrice] = useState('19.99');
  const [builderInitialStock, setBuilderInitialStock] = useState('50');
  
  // Selected Attributes for the current variation in builder
  const [selectedAttrValues, setSelectedAttrValues] = useState<Record<string, { id: string; value: string }>>({});

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
      const hasVars = vList.length > 1 || (vList.length === 1 && vList[0]?.attributeValues?.length > 0);
      setHasVariants(hasVars);

      if (!hasVars && vList.length > 0) {
        // Load single variant data
        const sv = vList[0];
        setSingleSku(sv.sku || '');
        setSingleBarcode(sv.barcode || '');
        setSinglePurchasePrice(String(sv.purchasePrice || '0.00'));
        setSingleSalePrice(String(sv.salePrice || '0.00'));
        const stockQty = sv.stocks?.find((s: any) => s.branchId === selectedBranchId)?.quantity || 0;
        setSingleInitialStock(String(stockQty));
      } else {
        // Load multiple variants list
        const mapped = vList.map((v: any) => {
          const stockQty = v.stocks?.find((s: any) => s.branchId === selectedBranchId)?.quantity || 0;
          return {
            id: v.id,
            sku: v.sku || '',
            barcode: v.barcode || '',
            purchasePrice: v.purchasePrice || 0,
            salePrice: v.salePrice || 0,
            initialStock: stockQty,
            imageIds: v.images ? v.images.map((img: any) => img.id) : [],
            stocks: v.stocks || [],
            attributeValues: (v.attributeValues || []).map((av: any) => {
              // av is usually just value entity. Let's trace parent name.
              return {
                attributeValueId: av.id,
                attributeName: av.attribute?.name || 'Atributo',
                valueText: av.value
              };
            })
          };
        });
        setVariantsList(mapped);

        // Auto-detect active attributes based on variants
        const activeIds = new Set<string>();
        vList.forEach((v: any) => {
          (v.attributeValues || []).forEach((av: any) => {
            if (av.attributeId) activeIds.add(av.attributeId);
          });
        });
        setActiveAttributeIds(Array.from(activeIds));
      }
    }
  }, [product, selectedBranchId]);

  const handleToggleImageSelection = (imageId: string) => {
    if (selectedImages.includes(imageId)) {
      setSelectedImages(selectedImages.filter(id => id !== imageId));
      setVariantsList(variantsList.map(v => ({
        ...v,
        imageIds: v.imageIds.filter(id => id !== imageId)
      })));
    } else {
      setSelectedImages([...selectedImages, imageId]);
    }
  };

  const handleAddActiveAttribute = () => {
    if (!selectedAttributeToAdd) return;
    if (!activeAttributeIds.includes(selectedAttributeToAdd)) {
      setActiveAttributeIds([...activeAttributeIds, selectedAttributeToAdd]);
    }
    setSelectedAttributeToAdd('');
  };

  const handleRemoveActiveAttribute = (attributeId: string) => {
    setActiveAttributeIds(activeAttributeIds.filter(id => id !== attributeId));
    const updated = { ...selectedAttrValues };
    delete updated[attributeId];
    setSelectedAttrValues(updated);
  };

  const handleAddVariantFromBuilder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!builderSku.trim()) {
      toast.warning('El SKU de la variante es requerido.');
      return;
    }

    const attributeValuesPayload = Object.entries(selectedAttrValues)
      .filter(([attrId, attrVal]) => activeAttributeIds.includes(attrId) && attrVal && attrVal.id)
      .map(([attrId, attrVal]) => {
        const parentAttribute = attributes.find(a => a.id === attrId);
        return {
          attributeValueId: attrVal.id,
          attributeName: parentAttribute?.name || 'Atributo',
          valueText: attrVal.value
        };
      });

    if (hasVariants && activeAttributeIds.length > 0) {
      if (attributeValuesPayload.length < activeAttributeIds.length) {
        toast.warning('Por favor selecciona un valor para todos los atributos activos.');
        return;
      }
    } else if (hasVariants && activeAttributeIds.length === 0) {
      toast.warning('Por favor activa al menos un atributo antes de crear variantes.');
      return;
    }

    const newCombinationKey = attributeValuesPayload
      .map(av => av.attributeValueId)
      .sort()
      .join(',');

    const isDuplicate = variantsList.some(v => {
      const existingKey = v.attributeValues
        .map(av => av.attributeValueId)
        .sort()
        .join(',');
      return existingKey === newCombinationKey;
    });

    if (isDuplicate) {
      toast.error('Ya existe una variante registrada con esta misma combinación.');
      return;
    }

    const isSkuTaken = variantsList.some(v => v.sku.toLowerCase() === builderSku.trim().toLowerCase());
    if (isSkuTaken) {
      toast.error(`El SKU "${builderSku.trim()}" ya está registrado.`);
      return;
    }

    setVariantsList([
      ...variantsList,
      {
        sku: builderSku.trim(),
        barcode: builderBarcode.trim(),
        purchasePrice: parseFloat(builderPurchasePrice) || 0,
        salePrice: parseFloat(builderSalePrice) || 0,
        initialStock: parseInt(builderInitialStock) || 0,
        imageIds: [],
        attributeValues: attributeValuesPayload
      }
    ]);

    setBuilderSku('');
    setBuilderBarcode('');
    setSelectedAttrValues({});
    toast.success('Variante agregada.');
  };

  const allPossibleCombinations = useMemo(() => {
    if (activeAttributeIds.length === 0) return [];
    
    const activeAttrsWithValues = activeAttributeIds.map(id => {
      const attr = attributes.find(a => a.id === id);
      return {
        id: id,
        name: attr?.name || 'Atributo',
        values: attr?.values || []
      };
    });

    const hasEmptyAttr = activeAttrsWithValues.some(a => a.values.length === 0);
    if (hasEmptyAttr) return [];

    const cartesian = (pools: any[]): any[][] => {
      const result: any[][] = [];
      const helper = (arr: any[], i: number) => {
        for (let j = 0, l = pools[i].values.length; j < l; j++) {
          const a = arr.concat([
            {
              attributeId: pools[i].id,
              attributeName: pools[i].name,
              attributeValueId: pools[i].values[j].id,
              valueText: pools[i].values[j].value
            }
          ]);
          if (i === pools.length - 1) {
            result.push(a);
          } else {
            helper(a, i + 1);
          }
        }
      };
      helper([], 0);
      return result;
    };

    return cartesian(activeAttrsWithValues);
  }, [activeAttributeIds, attributes]);

  const isCombinationAdded = (comb: any[]) => {
    const keyToCheck = comb.map(c => c.attributeValueId).sort().join(',');
    return variantsList.some(v => {
      const existingKey = v.attributeValues.map(av => av.attributeValueId).sort().join(',');
      return existingKey === keyToCheck;
    });
  };

  const handleAddSingleCombination = (comb: any[]) => {
    const cleanProdName = prodName.trim() ? prodName.trim().replace(/\s+/g, '-').toUpperCase() : 'PROD';
    const suffix = comb.map(c => c.valueText.toUpperCase()).join('-');
    const autoSku = `${cleanProdName}-${suffix}`;

    const isSkuTaken = variantsList.some(v => v.sku.toLowerCase() === autoSku.toLowerCase());
    const finalSku = isSkuTaken ? `${autoSku}-${Math.floor(Math.random() * 1000)}` : autoSku;

    setVariantsList([
      ...variantsList,
      {
        sku: finalSku,
        barcode: '',
        purchasePrice: parseFloat(builderPurchasePrice) || 10.00,
        salePrice: parseFloat(builderSalePrice) || 19.99,
        initialStock: parseInt(builderInitialStock) || 50,
        imageIds: [],
        attributeValues: comb.map(c => ({
          attributeValueId: c.attributeValueId,
          attributeName: c.attributeName,
          valueText: c.valueText
        }))
      }
    ]);
    toast.success('Variante añadida.');
  };

  const handleGenerateAllCombinations = () => {
    const toAdd = allPossibleCombinations.filter(comb => !isCombinationAdded(comb));
    if (toAdd.length === 0) {
      toast.warning('Todas las combinaciones posibles ya están en la lista.');
      return;
    }

    const cleanProdName = prodName.trim() ? prodName.trim().replace(/\s+/g, '-').toUpperCase() : 'PROD';
    const generated = toAdd.map(comb => {
      const suffix = comb.map(c => c.valueText.toUpperCase()).join('-');
      const autoSku = `${cleanProdName}-${suffix}`;
      return {
        sku: autoSku,
        barcode: '',
        purchasePrice: parseFloat(builderPurchasePrice) || 10.00,
        salePrice: parseFloat(builderSalePrice) || 19.99,
        initialStock: parseInt(builderInitialStock) || 50,
        imageIds: [],
        attributeValues: comb.map(c => ({
          attributeValueId: c.attributeValueId,
          attributeName: c.attributeName,
          valueText: c.valueText
        }))
      };
    });

    setVariantsList([...variantsList, ...generated]);
    toast.success(`Se agregaron ${generated.length} combinaciones.`);
  };

  const handleUpdateVariantField = (index: number, field: keyof typeof variantsList[0], value: any) => {
    const updated = [...variantsList];
    updated[index] = {
      ...updated[index],
      [field]: value
    } as any;
    setVariantsList(updated);
  };

  const handleToggleVariantImage = (variantIndex: number, imageId: string) => {
    const updated = [...variantsList];
    const currentImages = updated[variantIndex].imageIds;
    if (currentImages.includes(imageId)) {
      updated[variantIndex].imageIds = currentImages.filter(id => id !== imageId);
    } else {
      updated[variantIndex].imageIds = [...currentImages, imageId];
    }
    setVariantsList(updated);
  };

  const handleRemoveVariant = (index: number) => {
    setVariantsList(variantsList.filter((_, i) => i !== index));
    toast.info('Variante removida de la lista.');
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      toast.error('El nombre del producto es requerido.');
      return;
    }

    let finalVariants = [];

    if (!hasVariants) {
      if (!singleSku.trim()) {
        toast.error('Por favor ingresa el SKU para el producto.');
        return;
      }
      finalVariants = [{
        sku: singleSku.trim(),
        barcode: singleBarcode.trim(),
        purchasePrice: parseFloat(singlePurchasePrice) || 0,
        salePrice: parseFloat(singleSalePrice) || 0,
        attributeValues: [],
        imageIds: selectedImages,
        stocks: selectedBranchId ? [{
          branchId: selectedBranchId,
          quantity: parseInt(singleInitialStock) || 0
        }] : []
      }];
    } else {
      if (variantsList.length === 0) {
        toast.error('Por favor agrega al menos una variante al producto.');
        return;
      }

      const skus = variantsList.map(v => v.sku.trim().toLowerCase());
      const uniqueSkus = new Set(skus);
      if (skus.length !== uniqueSkus.size) {
        toast.error('Error: Hay SKUs duplicados en las variantes.');
        return;
      }

      const barcodes = variantsList.map(v => v.barcode.trim().toLowerCase()).filter(b => b !== '');
      const uniqueBarcodes = new Set(barcodes);
      if (barcodes.length !== uniqueBarcodes.size) {
        toast.error('Error: Hay códigos de barras duplicados en las variantes.');
        return;
      }

      finalVariants = variantsList.map(v => ({
        id: v.id,
        sku: v.sku,
        barcode: v.barcode,
        purchasePrice: v.purchasePrice,
        salePrice: v.salePrice,
        attributeValues: v.attributeValues.map(av => ({ attributeValueId: av.attributeValueId })),
        imageIds: v.imageIds,
        stocks: selectedBranchId ? [{
          branchId: selectedBranchId,
          quantity: v.initialStock
        }] : []
      }));
    }

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

      toast.success('¡Producto y variantes actualizados con éxito!');
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

  const handleQuickUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUploadFile && !quickUploadUrl) return;

    try {
      let registered;
      if (quickUploadFile) {
        registered = await uploadImage({
          file: quickUploadFile,
          description: quickUploadDesc.trim() || `Imagen de ${prodName || 'Producto'}`
        });
      } else if (quickUploadUrl) {
        registered = await uploadImageByUrl({
          url: quickUploadUrl,
          description: quickUploadDesc.trim() || `Imagen de ${prodName || 'Producto'}`
        });
      }

      if (registered) {
        setSelectedImages(prev => [...prev, registered.id]);
      }
      setQuickUploadFile(null);
      setQuickUploadUrl(null);
      setQuickUploadPreview(null);
      setQuickUploadDesc('');
      setIsUploadModalOpen(false);
      toast.success('¡Nueva imagen asociada!');
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      toast.error('Error al procesar la imagen.');
    }
  };

  const remainingAttributes = attributes.filter(a => !activeAttributeIds.includes(a.id));

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
      
      {/* Click outside backdrop close handler */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Slide-over Drawer Panel */}
      <div className="relative w-full max-w-4xl bg-bg-card border-l border-border-card shadow-2xl h-full flex flex-col animate-slide-in overflow-hidden z-50">
        
        {/* Header */}
        <div className="p-6 border-b border-border-card flex items-center justify-between bg-bg-dark/10">
          <div>
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
              <span>Editar Producto</span>
              <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-lg border border-primary/20 tracking-normal normal-case">ID: {product.id.slice(0, 8)}</span>
            </h3>
            <p className="text-[11px] text-neutral mt-0.5">Modifica los detalles generales, imágenes y la matriz de variantes de este artículo.</p>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2 text-neutral hover:text-secondary bg-bg-dark/40 hover:bg-bg-dark border border-border-card/60 rounded-xl transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Base Details */}
          <div className="space-y-4 bg-bg-dark/10 border border-border-card rounded-2xl p-5 shadow-sm">
            <h4 className="text-[11px] font-bold text-secondary uppercase tracking-wider border-b border-border-card pb-1.5">Información General</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] text-neutral font-bold uppercase tracking-wider mb-1">Nombre del Producto *</label>
                <input 
                  type="text" 
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2.5 px-3.5 text-xs text-secondary focus:outline-none focus:border-primary" 
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-[10px] text-neutral font-bold uppercase tracking-wider mb-1">Descripción</label>
                <textarea 
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2.5 px-3.5 text-xs text-secondary focus:outline-none focus:border-primary h-20 resize-none" 
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] text-neutral font-bold uppercase tracking-wider mb-1">Categoría</label>
                <select 
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2.5 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                >
                  <option value="">Seleccione una categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Images selection inside edit */}
            <div className="pt-2">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] text-neutral font-bold uppercase tracking-wider">Imágenes del Producto ({selectedImages.length} seleccionadas)</label>
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
                        <img src={img.url} className="w-full h-full object-cover" alt="subido" />
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
                  No tienes imágenes subidas. Haz click en "+ Subir Nueva Imagen" para agregar una.
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Simple product vs. Variants */}
          <div className="space-y-4 bg-bg-dark/10 border border-border-card rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-card pb-2">
              <h4 className="text-[11px] font-bold text-secondary uppercase tracking-wider">Matriz de Precios e Inventario</h4>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral">¿Producto con variantes?</span>
                <span className="text-xs font-bold text-secondary bg-bg-card border border-border-card px-2.5 py-0.5 rounded-lg">{hasVariants ? 'SÍ' : 'NO'}</span>
              </div>
            </div>

            {/* WITHOUT VARIANTS PANEL */}
            {!hasVariants && (
              <div className="grid grid-cols-2 gap-3.5 animate-fade-in pt-1">
                <div>
                  <label className="block text-[10px] text-neutral mb-1">Código SKU *</label>
                  <input 
                    type="text" 
                    required={!hasVariants}
                    value={singleSku}
                    onChange={(e) => setSingleSku(e.target.value)}
                    className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-neutral mb-1">Código de Barras</label>
                  <input 
                    type="text" 
                    value={singleBarcode}
                    onChange={(e) => setSingleBarcode(e.target.value)}
                    className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-neutral mb-1">Precio Compra ($) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required={!hasVariants}
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
                    required={!hasVariants}
                    value={singleSalePrice}
                    onChange={(e) => setSingleSalePrice(e.target.value)}
                    className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] text-neutral mb-1">Stock de esta sucursal *</label>
                  <input 
                    type="number" 
                    disabled
                    value={singleInitialStock}
                    onChange={(e) => setSingleInitialStock(e.target.value)}
                    className="w-full bg-bg-dark/50 border border-border-card rounded-xl py-2 px-3 text-xs text-neutral cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* WITH VARIANTS PANEL (Editable list) */}
            {hasVariants && (
              <div className="space-y-4 animate-fade-in pt-1">
                {variantsList.length > 0 ? (
                  <div className="border border-border-card rounded-xl p-3 bg-bg-dark/30 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="border-b border-border-card text-[9px] uppercase text-neutral tracking-wider">
                            <th className="pb-2 font-semibold w-8 text-center"></th>
                            <th className="pb-2 font-semibold">Variación</th>
                            <th className="pb-2 font-semibold w-32">SKU *</th>
                            <th className="pb-2 font-semibold w-28">Barras</th>
                            <th className="pb-2 font-semibold w-20">Compra *</th>
                            <th className="pb-2 font-semibold w-20">Venta *</th>
                            <th className="pb-2 font-semibold w-16 text-center">Stock</th>
                            <th className="pb-2 font-semibold w-28 text-center">Imágenes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-card/30">
                          {variantsList.map((v, idx) => (
                            <tr key={idx} className="text-[10px] text-secondary hover:bg-bg-card/50">
                              <td className="py-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariant(idx)}
                                  className="text-red-500 hover:text-red-600 p-1 hover:bg-red-500/10 rounded transition-colors"
                                  title="Quitar variante"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>

                              <td className="py-2 pr-2">
                                <div className="flex flex-col gap-0.5">
                                  {v.attributeValues.length > 0 ? (
                                    v.attributeValues.map((av, aIdx) => (
                                      <span key={aIdx} className="text-[9px] font-medium text-neutral">
                                        {av.attributeName}: <span className="text-secondary font-bold">{av.valueText}</span>
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-[9px] text-neutral italic">Sin atributos</span>
                                  )}
                                </div>
                              </td>

                              <td className="py-2 pr-2">
                                <input
                                  type="text"
                                  required
                                  value={v.sku}
                                  onChange={(e) => handleUpdateVariantField(idx, 'sku', e.target.value)}
                                  className="w-full bg-bg-dark border border-border-card rounded px-2 py-1 text-[10px] text-secondary font-mono focus:outline-none focus:border-primary"
                                />
                              </td>

                              <td className="py-2 pr-2">
                                <input
                                  type="text"
                                  value={v.barcode}
                                  onChange={(e) => handleUpdateVariantField(idx, 'barcode', e.target.value)}
                                  className="w-full bg-bg-dark border border-border-card rounded px-2 py-1 text-[10px] text-secondary font-mono focus:outline-none focus:border-primary"
                                />
                              </td>

                              <td className="py-2 pr-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  required
                                  value={v.purchasePrice}
                                  onChange={(e) => handleUpdateVariantField(idx, 'purchasePrice', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-bg-dark border border-border-card rounded px-2 py-1 text-[10px] text-secondary focus:outline-none focus:border-primary"
                                />
                              </td>

                              <td className="py-2 pr-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  required
                                  value={v.salePrice}
                                  onChange={(e) => handleUpdateVariantField(idx, 'salePrice', parseFloat(e.target.value) || 0)}
                                  className="w-full bg-bg-dark border border-border-card rounded px-2 py-1 text-[10px] text-secondary focus:outline-none focus:border-primary"
                                />
                              </td>

                              <td className="py-2 pr-2">
                                <input
                                  type="number"
                                  required
                                  disabled={!!v.id} // Deshabilitar stock si la variante ya existe en BD
                                  value={v.initialStock}
                                  onChange={(e) => handleUpdateVariantField(idx, 'initialStock', parseInt(e.target.value) || 0)}
                                  className={`w-full border rounded px-1.5 py-1 text-[10px] text-center focus:outline-none ${
                                    v.id 
                                      ? 'bg-bg-dark/50 border-border-card text-neutral cursor-not-allowed' 
                                      : 'bg-bg-dark border-border-card text-secondary focus:border-primary'
                                  }`}
                                />
                              </td>

                              <td className="py-2 pr-2 text-center">
                                {selectedImages.length > 0 ? (
                                  <div className="flex justify-center gap-1 flex-wrap max-w-[110px] mx-auto">
                                    {selectedImages.map((imgId) => {
                                      const imgObj = uploadedImages.find(i => i.id === imgId);
                                      if (!imgObj) return null;
                                      const isLinked = v.imageIds.includes(imgId);
                                      return (
                                        <div 
                                          key={imgId}
                                          onClick={() => handleToggleVariantImage(idx, imgId)}
                                          className={`w-5 h-5 rounded border overflow-hidden cursor-pointer relative transition-all ${
                                            isLinked ? 'border-primary ring-1 ring-primary' : 'border-border-card opacity-40 hover:opacity-100'
                                          }`}
                                          title={isLinked ? 'Desasociar foto' : 'Asociar foto'}
                                        >
                                          <img src={imgObj.url} className="w-full h-full object-cover" alt="mini" />
                                          {isLinked && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-[8px] text-neutral italic">Asocia fotos del producto primero</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4 border border-dashed border-border-card rounded-xl text-[11px] text-neutral">
                    No tienes variantes registradas. Agrega variantes usando el constructor de abajo.
                  </div>
                )}

                {/* Section 3: Add new variant constructor inside Edit Drawer */}
                <div className="border border-border-card rounded-xl p-4 bg-bg-dark/10 space-y-4 pt-4">
                  <div className="border-b border-border-card pb-2">
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Agregar Nuevas Variantes</span>
                    <span className="text-[10px] text-neutral">Genera o construye variantes adicionales para este artículo.</span>
                  </div>

                  {/* Attributes config */}
                  <div className="bg-bg-dark/30 border border-border-card rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block">Atributos del producto</span>
                      <span className="text-[9px] text-neutral">Define de qué atributos depende la variedad</span>
                    </div>

                    {remainingAttributes.length > 0 && (
                      <div className="flex gap-2">
                        <select
                          value={selectedAttributeToAdd}
                          onChange={(e) => setSelectedAttributeToAdd(e.target.value)}
                          className="flex-1 bg-bg-card border border-border-card rounded-lg px-2.5 py-1 text-xs text-secondary focus:outline-none"
                        >
                          <option value="">-- Seleccionar atributo --</option>
                          {remainingAttributes.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={handleAddActiveAttribute}
                          disabled={!selectedAttributeToAdd}
                          className="bg-primary hover:bg-primary-hover text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Agregar
                        </button>
                      </div>
                    )}

                    {activeAttributeIds.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-border-card/40 mt-1">
                        {activeAttributeIds.map(attrId => {
                          const attr = attributes.find(a => a.id === attrId);
                          return (
                            <div key={attrId} className="flex items-center gap-1.5 px-2.5 py-1 bg-bg-card border border-border-card rounded-lg text-[11px] text-secondary font-medium">
                              <span>{attr?.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveActiveAttribute(attrId)}
                                className="text-neutral hover:text-rose-500 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[10px] text-neutral italic">Selecciona qué atributos maneja el producto.</p>
                    )}
                  </div>

                  {activeAttributeIds.length > 0 && (
                    <div className="space-y-4">
                      {/* Generation triggers (Cartesian options selector) */}
                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center pb-2 border-b border-border-card/30">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-secondary block">Combinaciones Disponibles</span>
                            <span className="text-[9.5px] text-neutral leading-relaxed">Selecciona qué combinaciones agregar a la matriz.</span>
                          </div>
                          {allPossibleCombinations.length > 0 && (
                            <button
                              type="button"
                              onClick={handleGenerateAllCombinations}
                              className="bg-primary/25 hover:bg-primary/40 text-primary text-[10px] font-bold px-3 py-1 rounded-lg transition-all"
                            >
                              Agregar Todas
                            </button>
                          )}
                        </div>

                        {allPossibleCombinations.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                            {allPossibleCombinations.map((comb, index) => {
                              const isAdded = isCombinationAdded(comb);
                              return (
                                <div 
                                  key={index} 
                                  className={`p-2 rounded-lg border text-[10px] flex justify-between items-center transition-all ${
                                    isAdded 
                                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                                      : 'bg-bg-dark/40 border-border-card/60 text-secondary hover:border-primary/30'
                                  }`}
                                >
                                  <span className="truncate pr-1">
                                    {comb.map(c => c.valueText).join(' / ')}
                                  </span>
                                  {isAdded ? (
                                    <span className="text-[9px] font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-500 flex items-center gap-0.5">
                                      <Check className="w-2.5 h-2.5" />
                                      En lista
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleAddSingleCombination(comb)}
                                      className="bg-secondary hover:bg-secondary/80 text-white text-[9px] font-bold px-2 py-0.5 rounded transition-colors"
                                    >
                                      + Agregar
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[10px] text-neutral italic text-center py-2">Ingresa valores a los atributos para calcular combinaciones.</p>
                        )}
                      </div>

                      {/* Manual adding */}
                      <div className="border border-border-card rounded-xl p-4 bg-bg-dark/10 space-y-4">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block border-b border-border-card/50 pb-1.5">Agregar Variante Manual</span>
                        
                        <div className="grid grid-cols-2 gap-3.5 pb-2">
                          {activeAttributeIds.map((attrId) => {
                            const attr = attributes.find(a => a.id === attrId);
                            if (!attr) return null;
                            return (
                              <div key={attr.id}>
                                <label className="block text-[10px] text-neutral font-bold uppercase tracking-wider mb-1">{attr.name} *</label>
                                <select
                                  required
                                  value={selectedAttrValues[attr.id]?.id || ''}
                                  onChange={(e) => {
                                    const selectedValObj = attr.values.find(v => v.id === e.target.value);
                                    if (selectedValObj) {
                                      setSelectedAttrValues({
                                        ...selectedAttrValues,
                                        [attr.id]: { id: selectedValObj.id, value: selectedValObj.value }
                                      });
                                    } else {
                                      const updated = { ...selectedAttrValues };
                                      delete updated[attr.id];
                                      setSelectedAttrValues(updated);
                                    }
                                  }}
                                  className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                                >
                                  <option value="">Seleccionar...</option>
                                  {attr.values.map(v => (
                                    <option key={v.id} value={v.id}>{v.value}</option>
                                  ))}
                                </select>
                              </div>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div>
                            <label className="block text-[10px] text-neutral mb-1">Código SKU *</label>
                            <input 
                              type="text" 
                              value={builderSku}
                              onChange={(e) => setBuilderSku(e.target.value)}
                              placeholder="Ej. CAM-AZUL-XL" 
                              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-neutral mb-1">Código de Barras</label>
                            <input 
                              type="text" 
                              value={builderBarcode}
                              onChange={(e) => setBuilderBarcode(e.target.value)}
                              placeholder="Código EAN/UPC" 
                              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-neutral mb-1">Precio Compra ($) *</label>
                            <input 
                              type="number" 
                              step="0.01"
                              value={builderPurchasePrice}
                              onChange={(e) => setBuilderPurchasePrice(e.target.value)}
                              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] text-neutral mb-1">Precio Venta ($) *</label>
                            <input 
                              type="number" 
                              step="0.01"
                              value={builderSalePrice}
                              onChange={(e) => setBuilderSalePrice(e.target.value)}
                              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block text-[10px] text-neutral mb-1">Stock Inicial de esta Variante *</label>
                            <input 
                              type="number" 
                              value={builderInitialStock}
                              onChange={(e) => setBuilderInitialStock(e.target.value)}
                              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                            />
                          </div>
                        </div>

                        <button 
                          type="button" 
                          onClick={handleAddVariantFromBuilder}
                          className="w-full py-2.5 bg-secondary hover:bg-secondary/80 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Agregar Variante a la Ficha</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Section 4: Danger Zone */}
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 shadow-sm space-y-3">
              <h4 className="text-[11px] font-bold text-rose-500 uppercase tracking-wider border-b border-rose-500/20 pb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Zona de Peligro</span>
              </h4>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-secondary block">Eliminar este Producto</span>
                  <span className="text-[10px] text-neutral leading-relaxed">Esta acción es irreversible. Se borrarán todas las variantes y stocks asociados.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Producto</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Footer actions panel */}
        <div className="p-6 border-t border-border-card bg-bg-dark/20 flex gap-3.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-bg-dark hover:bg-bg-dark/80 text-secondary text-xs font-bold rounded-xl border border-border-card transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSaveProductSubmit}
            disabled={isUpdating}
            className="flex-1 py-3 bg-primary hover:bg-primary-hover disabled:bg-neutral/20 disabled:text-neutral/60 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando Cambios...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* QUICK MEDIA UPLOAD MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => {
                setIsUploadModalOpen(false);
                setQuickUploadFile(null);
                setQuickUploadPreview(null);
                setQuickUploadDesc('');
              }}
              className="absolute top-4 right-4 text-neutral hover:text-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-border-card pb-3 mb-4">
              <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Subida de Imagen Rápida</h3>
              <p className="text-[11px] text-neutral mt-0.5">Sube una nueva imagen para asociarla.</p>
            </div>

            <form onSubmit={handleQuickUploadSubmit} className="space-y-4">
              <div 
                onDragEnter={handleDragQuick}
                onDragOver={handleDragQuick}
                onDragLeave={handleDragQuick}
                onDrop={handleDropQuick}
                onClick={() => quickFileInputRef.current?.click()}
                className={`border-2 border-dashed border-border-card rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all ${
                  dragActiveQuick 
                    ? 'border-primary bg-primary/5' 
                    : quickUploadPreview 
                      ? 'bg-bg-dark/20' 
                      : 'border-border-card hover:border-primary/40 hover:bg-primary/5'
                }`}
              >
                <input 
                  type="file"
                  ref={quickFileInputRef}
                  onChange={handleQuickFileChange}
                  accept="image/*"
                  className="hidden"
                  disabled={isUploadingMedia}
                />

                {quickUploadPreview ? (
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/10">
                    <img src={quickUploadPreview} className="w-full h-full object-contain" alt="Vista previa" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="mx-auto w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="text-[11px] text-neutral">
                      <span className="text-primary font-semibold">Haz click para buscar</span> o arrastra una imagen
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral uppercase tracking-wider">Descripción</label>
                <input
                  type="text"
                  value={quickUploadDesc}
                  onChange={(e) => setQuickUploadDesc(e.target.value)}
                  placeholder="Ej. Detalle color verde..."
                  disabled={isUploadingMedia}
                  className="w-full text-xs bg-bg-dark border border-border-card rounded-xl p-2.5 text-secondary focus:outline-none focus:border-primary placeholder-neutral transition-all"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    setQuickUploadFile(null);
                    setQuickUploadUrl(null);
                    setQuickUploadPreview(null);
                    setQuickUploadDesc('');
                  }}
                  className="flex-1 bg-bg-dark hover:bg-bg-dark/80 text-secondary text-xs font-bold py-2.5 rounded-xl border border-border-card transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={(!quickUploadFile && !quickUploadUrl) || isUploadingMedia}
                  className="flex-1 bg-primary hover:bg-primary-hover disabled:bg-neutral/20 disabled:text-neutral/60 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  {isUploadingMedia ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir Imagen</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-55 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-bg-card border border-border-card rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">¿Eliminar Producto?</h3>
                <p className="text-[10px] text-neutral leading-relaxed">
                  Estás a punto de eliminar <span className="font-bold text-secondary">"{prodName}"</span>. Esta acción no se puede deshacer y borrará todo el historial de variantes de este artículo.
                </p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCloseDeleteConfirm}
                  className="flex-1 bg-bg-dark hover:bg-bg-dark/80 text-secondary text-xs font-bold py-2.5 rounded-xl border border-border-card transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProductSubmit}
                  disabled={isDeleting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-neutral/20 disabled:text-neutral/60 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sí, eliminar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default ProductEditDrawer;
