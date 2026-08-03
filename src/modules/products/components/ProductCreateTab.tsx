import React, { useState, useRef, useMemo } from 'react';
import { Tag, Barcode, Check, Plus, Trash2, X, Upload, Loader2, ArrowRight } from 'lucide-react';
import { useAttributes } from '../hooks/useAttributes';
import { useMediaUpload } from '../../media/hooks/useMedia';
import { useCreateVariant } from '../hooks/useProducts';
import { toast } from 'sonner';

interface ProductCreateTabProps {
  categories: any[];
  uploadedImages: any[];
  selectedBranchId: string;
  createSimpleProduct: (input: any) => Promise<any>;
  createVariableProduct: (input: any) => Promise<any>;
  onSuccess: () => void;
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

export const ProductCreateTab: React.FC<ProductCreateTabProps> = ({
  categories,
  uploadedImages,
  selectedBranchId,
  createSimpleProduct,
  createVariableProduct,
  onSuccess
}) => {

  const { attributes } = useAttributes();
  const { uploadImage, uploadImageByUrl, isUploading: isUploadingMedia } = useMediaUpload();
  const { createVariant } = useCreateVariant();

  // Wizard state
  const [step, setStep] = useState<1 | 2>(1);
  const [createdProduct, setCreatedProduct] = useState<any | null>(null);
  const [isSavingVariants, setIsSavingVariants] = useState(false);

  // Pills attribute selection states
  const [selectedPillValues, setSelectedPillValues] = useState<Record<string, string[]>>({});

  // Bulk actions states
  const [bulkPurchase, setBulkPurchase] = useState('');
  const [bulkSale, setBulkSale] = useState('');
  const [bulkStock, setBulkStock] = useState('');

  // Drag and drop for quick upload modal
  const [dragActiveQuick, setDragActiveQuick] = useState(false);
  const [quickUploadUrl, setQuickUploadUrl] = useState<string | null>(null);

  // Core Product States
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [hasVariants, setHasVariants] = useState(false);

  // Active Attributes for this product (user adds them dynamically)
  const [activeAttributeIds, setActiveAttributeIds] = useState<string[]>([]);

  // Single Variant (for product WITHOUT variants)
  const [singleSku, setSingleSku] = useState('');
  const [singleBarcode, setSingleBarcode] = useState('');
  const [singlePurchasePrice, setSinglePurchasePrice] = useState('10.00');
  const [singleSalePrice, setSingleSalePrice] = useState('19.99');
  const [singleInitialStock, setSingleInitialStock] = useState('50');

  // Multiple Variants Builder (for product WITH variants)
  const [variantsList, setVariantsList] = useState<{
    sku: string;
    barcode: string;
    purchasePrice: number;
    salePrice: number;
    initialStock: number;
    imageIds: string[]; // Images associated specifically to this variant
    attributeValues: { attributeValueId: string; attributeName: string; valueText: string }[];
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
      toast.warning('Por favor activa al menos un atributo (ej. Talla o Color) antes de crear variantes.');
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
      toast.error('Ya existe una variante registrada con esta misma combinación de atributos.');
      return;
    }

    const isSkuTaken = variantsList.some(v => v.sku.toLowerCase() === builderSku.trim().toLowerCase());
    if (isSkuTaken) {
      toast.error(`El SKU "${builderSku.trim()}" ya está siendo utilizado por otra variante.`);
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
    toast.success('Variante agregada a la lista.');
  };

  const handleTogglePill = (attributeId: string, valueId: string) => {
    const current = selectedPillValues[attributeId] || [];
    if (current.includes(valueId)) {
      setSelectedPillValues({
        ...selectedPillValues,
        [attributeId]: current.filter(id => id !== valueId)
      });
    } else {
      setSelectedPillValues({
        ...selectedPillValues,
        [attributeId]: [...current, valueId]
      });
    }
  };

  // Generate dynamic list of combinations based on selected pills (Cartesian Product)
  const selectedPillsCombinations = useMemo(() => {
    const activePools = Object.entries(selectedPillValues)
      .filter(([_, valueIds]) => valueIds.length > 0)
      .map(([attrId, valueIds]) => {
        const attr = attributes.find(a => a.id === attrId);
        return {
          id: attrId,
          name: attr?.name || 'Atributo',
          values: attr?.values.filter(v => valueIds.includes(v.id)) || []
        };
      });

    if (activePools.length === 0) return [];

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

    return cartesian(activePools);
  }, [selectedPillValues, attributes]);

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

    // Validate SKU uniqueness locally
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
    const toAdd = selectedPillsCombinations.filter(comb => !isCombinationAdded(comb));
    if (toAdd.length === 0) {
      toast.warning('Todas las combinaciones seleccionadas ya están en la lista o no has seleccionado suficientes píldoras.');
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

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      toast.error('El nombre del producto es requerido.');
      return;
    }

    try {
      const categoryId = prodCategory || undefined;

      if (!hasVariants) {
        if (!singleSku.trim()) {
          toast.error('Por favor ingresa el SKU para el producto.');
          return;
        }

        await createSimpleProduct({
          name: prodName.trim(),
          description: prodDesc.trim(),
          categoryId,
          imageIds: selectedImages,
          sku: singleSku.trim(),
          barcode: singleBarcode.trim(),
          purchasePrice: parseFloat(singlePurchasePrice) || 0,
          salePrice: parseFloat(singleSalePrice) || 0,
          stocks: selectedBranchId ? [{
            branchId: selectedBranchId,
            quantity: parseInt(singleInitialStock) || 0
          }] : []
        });

        toast.success('¡Producto simple e inventario registrados con éxito!');
        onSuccess();
      } else {
        const res = await createVariableProduct({
          name: prodName.trim(),
          description: prodDesc.trim(),
          categoryId,
          imageIds: selectedImages,
          variants: [] // Base product starts with no variants, added in step 2
        });

        setCreatedProduct(res);
        setStep(2);
        toast.success('¡Ficha base del producto guardada! Procedamos a configurar las variantes.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al registrar el producto en el servidor.');
    }
  };


  const handleSaveAllVariants = async () => {
    if (!createdProduct) return;
    if (variantsList.length === 0) {
      toast.error('Por favor agrega o genera al menos una variante para el producto.');
      return;
    }

    const skus = variantsList.map(v => v.sku.trim().toLowerCase());
    const uniqueSkus = new Set(skus);
    if (skus.length !== uniqueSkus.size) {
      toast.error('Error: Hay SKUs duplicados en las variantes. Cada variante debe tener un SKU único.');
      return;
    }

    const barcodes = variantsList.map(v => v.barcode.trim().toLowerCase()).filter(b => b !== '');
    const uniqueBarcodes = new Set(barcodes);
    if (barcodes.length !== uniqueBarcodes.size) {
      toast.error('Error: Hay códigos de barras duplicados en las variantes.');
      return;
    }

    setIsSavingVariants(true);
    let successCount = 0;

    for (const variant of variantsList) {
      try {
        const payload = {
          sku: variant.sku.trim(),
          barcode: variant.barcode.trim(),
          purchasePrice: variant.purchasePrice,
          salePrice: variant.salePrice,
          attributeValues: variant.attributeValues.map(av => ({ attributeValueId: av.attributeValueId })),
          imageIds: variant.imageIds,
          stocks: selectedBranchId ? [{
            branchId: selectedBranchId,
            quantity: variant.initialStock
          }] : []
        };
        await createVariant({ productId: createdProduct.id, input: payload });
        successCount++;
      } catch (err: any) {
        toast.error(`Error en variante "${variant.sku}": ${err.message || 'Error en servidor'}`);
      }
    }

    setIsSavingVariants(false);

    if (successCount === variantsList.length) {
      toast.success('¡Todas las variantes e inventario registrados con éxito!');
      onSuccess();
    } else if (successCount > 0) {
      toast.warning(`Se registraron ${successCount} de ${variantsList.length} variantes. Por favor corrige las restantes.`);
      // Filter out successfully saved variants from list to let user correct and save again
      const unsaved = variantsList.filter((_, idx) => {
        // Simple heuristic: if it was saved, we assume it went in order. Since we don't have IDs on input, 
        // we can just clear the successfully saved ones from the beginning of the array.
        return idx >= successCount;
      });
      setVariantsList(unsaved);
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
      toast.success('¡Nueva imagen asociada con éxito!');
    } catch (error) {
      console.error('Error al subir la imagen en modal rápido:', error);
      toast.error('Error al procesar la imagen.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative">
      {/* Wizard Steps indicator */}
      {hasVariants && (
        <div className="flex items-center justify-center gap-4 bg-bg-card border border-border-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-primary text-white' : 'bg-emerald-600 text-white'}`}>
              {step === 1 ? '1' : <Check className="w-3.5 h-3.5 font-bold" />}
            </span>
            <span className={`text-xs font-bold ${step === 1 ? 'text-secondary' : 'text-neutral'}`}>Ficha General</span>
          </div>
          <div className="w-12 h-px bg-border-card" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-primary text-white' : 'bg-bg-dark text-neutral border border-border-card'}`}>2</span>
            <span className={`text-xs font-bold ${step === 2 ? 'text-secondary' : 'text-neutral'}`}>Configuración de Variantes</span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {step === 1 ? (
          /* STEP 1: General Product Information */
          <form onSubmit={handleCreateProductSubmit} className="bg-bg-card border border-border-card rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="border-b border-border-card pb-3">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wide">Ficha del Producto</h4>
              <p className="text-xs text-neutral mt-0.5">Información base de catalogación general.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] text-neutral font-bold uppercase tracking-wider mb-1">Nombre del Producto *</label>
                <input 
                  type="text" 
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Ej. Camisa Deportiva Dry-Fit" 
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

            {/* Toggle Variants */}
            <div className="pt-3 border-t border-border-card/50">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-secondary block">¿Este producto se vende en múltiples variantes?</span>
                  <span className="text-[10px] text-neutral block mt-0.5">Habilita esta opción si se manejan diferentes tallas, colores, materiales, etc.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={hasVariants}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasVariants(checked);
                      if (checked) {
                        setBuilderPurchasePrice(singlePurchasePrice);
                        setBuilderSalePrice(singleSalePrice);
                        setBuilderInitialStock(singleInitialStock);
                      } else {
                        setVariantsList([]);
                        setActiveAttributeIds([]);
                        setSelectedPillValues({});
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-bg-dark border border-border-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral after:border-border-card after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>
            </div>

            {/* Single Product standard fields */}
            {!hasVariants && (
              <div className="pt-4 border-t border-border-card/50 space-y-4 animate-fade-in">
                <h5 className="text-[11px] font-bold text-secondary uppercase tracking-wider">Detalles de Precio e Inventario (Estándar)</h5>
                
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] text-neutral mb-1">Código SKU *</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral" />
                      <input 
                        type="text" 
                        required={!hasVariants}
                        value={singleSku}
                        onChange={(e) => setSingleSku(e.target.value)}
                        placeholder="SKU-PRINCIPAL-01" 
                        className="w-full bg-bg-dark border border-border-card rounded-xl py-2 pl-9 pr-3 text-xs text-secondary focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-neutral mb-1">Código de Barras</label>
                    <div className="relative">
                      <Barcode className="absolute left-3 top-2.5 w-3.5 h-3.5 text-neutral" />
                      <input 
                        type="text" 
                        value={singleBarcode}
                        onChange={(e) => setSingleBarcode(e.target.value)}
                        placeholder="Código EAN/UPC" 
                        className="w-full bg-bg-dark border border-border-card rounded-xl py-2 pl-9 pr-3 text-xs text-secondary focus:outline-none focus:border-primary"
                      />
                    </div>
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
                    <label className="block text-[10px] text-neutral mb-1">Stock Inicial *</label>
                    <input 
                      type="number" 
                      required={!hasVariants}
                      value={singleInitialStock}
                      onChange={(e) => setSingleInitialStock(e.target.value)}
                      className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              <span>{hasVariants ? 'Guardar y Continuar a Variantes' : 'Crear Producto e Inventario'}</span>
              {hasVariants && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        ) : (
          /* STEP 2: Configure Attributes and Variants */
          <div className="space-y-6 animate-fade-in">
            {/* Attributes definition */}
            <div className="bg-bg-card border border-border-card rounded-2xl p-6 space-y-5 shadow-sm">
              <div className="border-b border-border-card pb-2">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wide">Estructura de Variantes</h4>
                <p className="text-[11px] text-neutral mt-0.5">Selecciona los valores de atributos para generar combinaciones masivamente.</p>
              </div>

              <div className="bg-bg-dark/30 border border-border-card rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border-card/30">
                  <div>
                    <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Valores de Atributos</span>
                    <span className="text-[9px] text-neutral">Toca las píldoras para seleccionar los valores que deseas combinar.</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {attributes.map(attr => {
                    const selectedVals = selectedPillValues[attr.id] || [];
                    return (
                      <div key={attr.id} className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-secondary uppercase tracking-wide">{attr.name}</label>
                        <div className="flex flex-wrap gap-1.5">
                          {attr.values.map(val => {
                            const isSelected = selectedVals.includes(val.id);
                            return (
                              <button
                                key={val.id}
                                type="button"
                                onClick={() => handleTogglePill(attr.id, val.id)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                                  isSelected 
                                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30' 
                                    : 'bg-bg-card text-neutral border-border-card hover:border-neutral/40 hover:text-secondary'
                                }`}
                              >
                                {val.value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedPillsCombinations.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-border-card/30">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-secondary block">Combinaciones Disponibles</span>
                        <span className="text-[9.5px] text-neutral leading-relaxed">Selecciona qué combinaciones agregar al catálogo.</span>
                      </div>
                      {selectedPillsCombinations.length > 0 && (
                        <button
                          type="button"
                          onClick={handleGenerateAllCombinations}
                          className="bg-primary/25 hover:bg-primary/40 text-primary text-[10px] font-bold px-3 py-1 rounded-lg transition-all"
                        >
                          Agregar Todas
                        </button>
                      )}
                    </div>

                    {selectedPillsCombinations.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {selectedPillsCombinations.map((comb, index) => {
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
                      <p className="text-[10px] text-neutral italic text-center py-2">Selecciona valores de las píldoras para calcular combinaciones.</p>
                    )}
                  </div>
                </div>
              )}

              {attributes.length > 0 && (
                <form onSubmit={handleAddVariantFromBuilder} className="border border-border-card rounded-xl p-4 bg-bg-dark/10 space-y-4">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider block border-b border-border-card/50 pb-1.5">Agregar Variante Manualmente</span>
                  
                  <div className="grid grid-cols-2 gap-3.5 pb-2">
                    {attributes.map((attr) => {
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
                          required
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
                          required
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
                          required
                          value={builderSalePrice}
                          onChange={(e) => setBuilderSalePrice(e.target.value)}
                          className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-neutral mb-1">Stock Inicial de esta Variante *</label>
                        <input 
                          type="number" 
                          required
                          value={builderInitialStock}
                          onChange={(e) => setBuilderInitialStock(e.target.value)}
                          className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="w-full py-2.5 bg-secondary hover:bg-secondary/80 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Variante a la Lista</span>
                    </button>
                  </form>
                )}
            </div>

            {/* List and table of variants to save */}
            {variantsList.length > 0 && (
              <div className="bg-bg-card border border-border-card rounded-2xl p-6 space-y-4 shadow-sm overflow-hidden">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block">Variantes Listas para Registrar ({variantsList.length})</span>
                
                {/* Bulk Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-bg-dark/40 border border-border-card rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-neutral">Acciones Masivas</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder="Precio Compra ($)"
                        value={bulkPurchase}
                        onChange={(e) => setBulkPurchase(e.target.value)}
                        className="w-24 bg-bg-card border border-border-card rounded px-2 py-1 text-[10px] text-secondary placeholder-neutral focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseFloat(bulkPurchase);
                          if (!isNaN(val)) {
                            setVariantsList(variantsList.map(v => ({ ...v, purchasePrice: val })));
                            toast.success('Costo de compra aplicado a todas las variantes');
                            setBulkPurchase('');
                          } else {
                            toast.error('Ingresa un número válido.');
                          }
                        }}
                        className="bg-primary hover:bg-primary-hover text-white text-[9px] font-bold px-2 py-1 rounded transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder="Precio Venta ($)"
                        value={bulkSale}
                        onChange={(e) => setBulkSale(e.target.value)}
                        className="w-24 bg-bg-card border border-border-card rounded px-2 py-1 text-[10px] text-secondary placeholder-neutral focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseFloat(bulkSale);
                          if (!isNaN(val)) {
                            setVariantsList(variantsList.map(v => ({ ...v, salePrice: val })));
                            toast.success('Precio de venta aplicado a todas las variantes');
                            setBulkSale('');
                          } else {
                            toast.error('Ingresa un número válido.');
                          }
                        }}
                        className="bg-primary hover:bg-primary-hover text-white text-[9px] font-bold px-2 py-1 rounded transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        placeholder="Stock Inicial"
                        value={bulkStock}
                        onChange={(e) => setBulkStock(e.target.value)}
                        className="w-24 bg-bg-card border border-border-card rounded px-2 py-1 text-[10px] text-secondary placeholder-neutral focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseInt(bulkStock);
                          if (!isNaN(val)) {
                            setVariantsList(variantsList.map(v => ({ ...v, initialStock: val })));
                            toast.success('Stock inicial aplicado a todas las variantes');
                            setBulkStock('');
                          } else {
                            toast.error('Ingresa un número válido.');
                          }
                        }}
                        className="bg-primary hover:bg-primary-hover text-white text-[9px] font-bold px-2 py-1 rounded transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>

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
                              title="Quitar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>

                          <td className="py-2 pr-2">
                            <div className="flex flex-col gap-0.5">
                              {v.attributeValues.map((av, aIdx) => (
                                <span key={aIdx} className="text-[9px] font-medium text-neutral">
                                  {av.attributeName}: <span className="text-secondary font-bold">{av.valueText}</span>
                                </span>
                              ))}
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
                              value={v.initialStock}
                              onChange={(e) => handleUpdateVariantField(idx, 'initialStock', parseInt(e.target.value) || 0)}
                              className="w-full bg-bg-dark border border-border-card rounded px-1.5 py-1 text-[10px] text-center text-secondary focus:outline-none focus:border-primary"
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
                                      title={isLinked ? 'Desasociar foto' : 'Asociar foto a variante'}
                                    >
                                      <img src={imgObj.url} className="w-full h-full object-cover" alt="miniatura" />
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
                              <span className="text-[8px] text-neutral italic">Asocia fotos arriba primero</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button 
                  onClick={handleSaveAllVariants}
                  disabled={isSavingVariants}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral/20 disabled:text-neutral/60 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isSavingVariants ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Registrando Variantes...</span>
                    </>
                  ) : (
                    <span>Registrar Variantes y Finalizar</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
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
              <p className="text-[11px] text-neutral mt-0.5">Sube una nueva imagen sin salir de la ficha del producto.</p>
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
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-[10px] text-white font-semibold">Cambiar imagen</span>
                    </div>
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
                <label className="text-[10px] font-bold text-neutral uppercase tracking-wider">Descripción de la Imagen</label>
                <input
                  type="text"
                  value={quickUploadDesc}
                  onChange={(e) => setQuickUploadDesc(e.target.value)}
                  placeholder="Ej. Frente de camisa azul, Detalle de costuras..."
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

    </div>
  );
};
export default ProductCreateTab;
