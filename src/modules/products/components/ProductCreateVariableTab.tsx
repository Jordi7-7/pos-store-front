import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Tag as TagIcon, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { useCategories } from '../hooks/useCategories';
import { useAttributes } from '../hooks/useAttributes';
import { useCreateVariableProduct } from '../hooks/useProducts';
import { MediaGallerySelectorModal } from './forms/MediaGallerySelectorModal';
import { ImageUploadModal } from './forms/ImageUploadModal';
import { 
  WizardProgressBar, 
  StepGeneralInfo, 
  StepAttributeSelection, 
  StepVariantsMatrix,
  type VariantRowData,
  type VariableProductHeaderValues
} from './variable-wizard';
import type { Attribute, AttributeValue } from '..';

// ── Header Validation Schema ────────────────────────────────────────────────
const variableProductHeaderSchema = z.object({
  name: z.string().min(1, 'El nombre del producto es obligatorio'),
  baseSku: z.string().min(1, 'El SKU base es obligatorio para un producto variable'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
});

interface ProductCreateVariableTabProps {
  selectedBranchId: string;
  onSuccess?: () => void;
  onNavigateToAttributes?: () => void;
}

const WIZARD_STEPS = [
  {
    number: 1,
    title: 'Información General',
    description: 'Nombre, categoría y fotografías',
    icon: Package,
  },
  {
    number: 2,
    title: 'Atributos y Opciones',
    description: 'Tallas, colores, dimensiones',
    icon: TagIcon,
  },
  {
    number: 3,
    title: 'Matriz y Precios',
    description: 'SKU, costos y stock por variante',
    icon: Sparkles,
  },
];

export const ProductCreateVariableTab: React.FC<ProductCreateVariableTabProps> = ({
  selectedBranchId,
  onSuccess,
  onNavigateToAttributes,
}) => {
  // Wizard current step
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Categories & Attributes queries/mutations
  const { categories, createCategory, isCreating: isCreatingCategory } = useCategories();
  const { 
    attributes, 
    isLoading: isLoadingAttributes, 
    createAttribute, 
    isCreatingAttribute, 
    createAttributeValue, 
    isCreatingValue 
  } = useAttributes();
  const { createVariableProduct, isCreating: isSubmitting } = useCreateVariableProduct();

  // ── Step 1 Form: General info ────────────────────────────────────────────
  const {
    control,
    trigger,
    watch,
    getValues,
    formState: { errors },
  } = useForm<VariableProductHeaderValues>({
    resolver: zodResolver(variableProductHeaderSchema),
    defaultValues: {
      name: '',
      baseSku: '',
      description: '',
      categoryId: '',
    },
  });

  const productName = watch('name');
  const baseSkuHeader = watch('baseSku');

  // Media state
  const [selectedImages, setSelectedImages] = useState<{ id: string; url: string; description?: string }[]>([]);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeVariantForImage, setActiveVariantForImage] = useState<string | null>(null);

  // ── Step 2 State: Selected attributes for matrix ─────────────────────────
  // attributeId -> string[] of attributeValueIds
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<Record<string, string[]>>({});

  // ── Step 3 State: Generated variants matrix & bulk helper ────────────────
  const [variants, setVariants] = useState<VariantRowData[]>([]);
  const [bulkSkuPrefix, setBulkSkuPrefix] = useState<string>('');
  const [bulkPurchasePrice, setBulkPurchasePrice] = useState<string>('');
  const [bulkSalePrice, setBulkSalePrice] = useState<string>('');
  const [bulkWholesalePrice, setBulkWholesalePrice] = useState<string>('');
  const [bulkStock, setBulkStock] = useState<string>('');

  const isAllBranches = !selectedBranchId;

  // Toggle value chip
  const handleToggleValue = (attrId: string, valId: string) => {
    setSelectedAttributeValues((prev) => {
      const current = prev[attrId] || [];
      const updated = current.includes(valId)
        ? current.filter((id) => id !== valId)
        : [...current, valId];

      if (updated.length === 0) {
        const copy = { ...prev };
        delete copy[attrId];
        return copy;
      }
      return { ...prev, [attrId]: updated };
    });
  };

  // Step 1 -> Step 2 validation
  const handleProceedToStep2 = async () => {
    const isValid = await trigger(['name', 'baseSku']);
    if (!isValid) {
      toast.warning('Por favor completa el nombre y el SKU base antes de continuar.');
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 -> Step 3 Cartesian generator
  const handleGenerateAndProceedToStep3 = () => {
    const activeAttrIds = Object.keys(selectedAttributeValues).filter(
      (attrId) => (selectedAttributeValues[attrId] || []).length > 0
    );

    if (activeAttrIds.length === 0) {
      toast.warning('Selecciona al menos un valor de atributo para continuar.');
      return;
    }

    const attrPool = activeAttrIds.map((attrId) => {
      const attr = attributes.find((a:Attribute) => a.id === attrId);
      const valIds = selectedAttributeValues[attrId];
      const vals = (attr?.values || []).filter((v: AttributeValue) => valIds.includes(v.id));
      return {
        attributeId: attrId,
        attributeName: attr?.name || 'Atributo',
        values: vals,
      };
    });

    const cartesian = (arrays: any[]): any[][] => {
      return arrays.reduce(
        (acc, curr) => acc.flatMap((d: any) => curr.values.map((v: any) => [...d, {
          attributeId: curr.attributeId,
          attributeName: curr.attributeName,
          valueId: v.id,
          valueName: v.value,
        }])),
        [[]]
      );
    };

    const combinations = cartesian(attrPool);

    const rawPrefix = (baseSkuHeader && baseSkuHeader.trim()) || (bulkSkuPrefix && bulkSkuPrefix.trim());
    const baseSku = rawPrefix
      ? rawPrefix.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
      : (productName || 'PROD')
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .slice(0, 6) || 'PROD';

    // Synchronize bulk SKU input with this prefix if not already set
    if (!bulkSkuPrefix && rawPrefix) {
      setBulkSkuPrefix(rawPrefix.trim().toUpperCase());
    } else if (!bulkSkuPrefix) {
      setBulkSkuPrefix(baseSku);
    }

    const generated: VariantRowData[] = combinations.map((combo, idx) => {
      const sku = `${baseSku}-${idx + 1}`;
      return {
        id: `var-${Date.now()}-${idx}`,
        sku,
        barcode: '',
        purchasePrice: bulkPurchasePrice ? Number(bulkPurchasePrice) : 0,
        salePrice: bulkSalePrice ? Number(bulkSalePrice) : 0,
        wholesalePrice: bulkWholesalePrice ? Number(bulkWholesalePrice) : null,
        initialStock: bulkStock ? Number(bulkStock) : 0,
        combination: combo,
      };
    });

    setVariants(generated);
    setCurrentStep(3);
    toast.success(`Se generaron ${generated.length} combinaciones.`);
  };

  // Bulk Apply
  const handleApplyBulk = () => {
    if (variants.length === 0) return;
    const cleanPrefix = bulkSkuPrefix.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');

    setVariants((prev) =>
      prev.map((v, idx) => {
        let updatedSku = v.sku;
        if (cleanPrefix) {
          updatedSku = `${cleanPrefix}-${idx + 1}`;
        }
        return {
          ...v,
          sku: updatedSku,
          purchasePrice: bulkPurchasePrice !== '' ? Number(bulkPurchasePrice) : v.purchasePrice,
          salePrice: bulkSalePrice !== '' ? Number(bulkSalePrice) : v.salePrice,
          wholesalePrice: bulkWholesalePrice !== '' ? Number(bulkWholesalePrice) : v.wholesalePrice,
          initialStock: bulkStock !== '' ? Number(bulkStock) : v.initialStock,
        };
      })
    );
    toast.success('Valores aplicados a todas las variantes.');
  };

  const handleUpdateVariantField = (id: string, field: keyof VariantRowData, value: any) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleRemoveVariantRow = (id: string) => {
    const updated = variants.filter((v) => v.id !== id);
    setVariants(updated);
    if (updated.length === 0) {
      setCurrentStep(2);
      toast.info('Se eliminaron todas las variantes. Regresaste a la selección de atributos.');
    }
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    if (!selectedBranchId) {
      toast.warning('Por favor selecciona una sucursal específica en la barra superior antes de guardar.');
      return;
    }

    if (variants.length === 0) {
      toast.warning('Debes tener al menos una variante para registrar el producto compuesto.');
      return;
    }

    // Validate SKUs
    const skuSet = new Set<string>();
    for (const v of variants) {
      if (!v.sku.trim()) {
        toast.error('Todas las variantes deben tener un SKU válido.');
        return;
      }
      if (skuSet.has(v.sku.trim().toUpperCase())) {
        toast.error(`El SKU "${v.sku}" está repetido en la lista.`);
        return;
      }
      skuSet.add(v.sku.trim().toUpperCase());
    }

    const headerData = getValues();

    try {
      const payload = {
        name: headerData.name.trim(),
        baseSku: headerData.baseSku?.trim() ? headerData.baseSku.trim().toUpperCase() : (bulkSkuPrefix?.trim() ? bulkSkuPrefix.trim().toUpperCase() : undefined),
        description: headerData.description?.trim() || '',
        categoryId: headerData.categoryId || undefined,
        imageIds: selectedImages.map((img) => img.id),
        variants: variants.map((v) => ({
          sku: v.sku.trim(),
          barcode: v.barcode.trim() || undefined,
          purchasePrice: Number(v.purchasePrice) || 0,
          salePrice: Number(v.salePrice) || 0,
          wholesalePrice: v.wholesalePrice !== null && v.wholesalePrice !== undefined ? Number(v.wholesalePrice) : null,
          imageIds: v.images && v.images.length > 0 ? v.images.map((img) => img.id) : (v.imageIds || []),
          attributeValues: v.combination.map((c) => ({ attributeValueId: c.valueId })),
          stocks: [{ branchId: selectedBranchId, quantity: Number(v.initialStock) || 0 }],
        })),
      };

      await createVariableProduct(payload);
      toast.success('¡Producto compuesto y variantes registrados con éxito!');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al guardar el producto compuesto.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Visual Stepper */}
      <WizardProgressBar
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onStepClick={(stepNum) => {
          if (stepNum < currentStep) {
            setCurrentStep(stepNum);
          }
        }}
      />

      {/* Step 1: General Info */}
      {currentStep === 1 && (
        <StepGeneralInfo
          control={control}
          errors={errors}
          categories={categories}
          createCategory={createCategory}
          isCreatingCategory={isCreatingCategory}
          selectedImages={selectedImages}
          onRemoveImage={(id) => setSelectedImages((prev) => prev.filter((img) => img.id !== id))}
          onOpenGalleryModal={() => {
            setActiveVariantForImage(null);
            setIsGalleryModalOpen(true);
          }}
          onOpenUploadModal={() => {
            setActiveVariantForImage(null);
            setIsUploadModalOpen(true);
          }}
          onNext={handleProceedToStep2}
        />
      )}

      {/* Step 2: Attribute Selection */}
      {currentStep === 2 && (
        <StepAttributeSelection
          attributes={attributes}
          isLoadingAttributes={isLoadingAttributes}
          selectedAttributeValues={selectedAttributeValues}
          onToggleValue={handleToggleValue}
          createAttribute={createAttribute}
          isCreatingAttribute={isCreatingAttribute}
          createAttributeValue={createAttributeValue}
          isCreatingValue={isCreatingValue}
          onNavigateToAttributes={onNavigateToAttributes}
          onBack={() => setCurrentStep(1)}
          onGenerateAndProceed={handleGenerateAndProceedToStep3}
        />
      )}

      {/* Step 3: Variants Matrix & Submission */}
      {currentStep === 3 && (
        <StepVariantsMatrix
          variants={variants}
          baseSkuPrefix={baseSkuHeader || bulkSkuPrefix}
          onUpdateVariantField={handleUpdateVariantField}
          onRemoveVariantRow={handleRemoveVariantRow}
          onClearVariants={() => {
            setVariants([]);
            setCurrentStep(2);
          }}
          onOpenVariantGallery={(variantId) => {
            setActiveVariantForImage(variantId);
            setIsGalleryModalOpen(true);
          }}
          bulkSkuPrefix={bulkSkuPrefix}
          setBulkSkuPrefix={setBulkSkuPrefix}
          bulkPurchasePrice={bulkPurchasePrice}
          setBulkPurchasePrice={setBulkPurchasePrice}
          bulkSalePrice={bulkSalePrice}
          setBulkSalePrice={setBulkSalePrice}
          bulkWholesalePrice={bulkWholesalePrice}
          setBulkWholesalePrice={setBulkWholesalePrice}
          bulkStock={bulkStock}
          setBulkStock={setBulkStock}
          onApplyBulk={handleApplyBulk}
          isSubmitting={isSubmitting}
          isAllBranches={isAllBranches}
          onBack={() => setCurrentStep(2)}
          onSubmit={handleFinalSubmit}
        />
      )}

      {/* Multimedia Modals */}
      <MediaGallerySelectorModal
        open={isGalleryModalOpen}
        onOpenChange={(open) => {
          setIsGalleryModalOpen(open);
          if (!open) setActiveVariantForImage(null);
        }}
        selectedImages={
          activeVariantForImage
            ? variants.find((v) => v.id === activeVariantForImage)?.images || []
            : selectedImages
        }
        onToggleImage={(image) => {
          if (activeVariantForImage) {
            setVariants((prev) =>
              prev.map((v) => {
                if (v.id !== activeVariantForImage) return v;
                const existing = v.images || [];
                const isSelected = existing.some((img) => img.id === image.id);
                const updated = isSelected
                  ? existing.filter((img) => img.id !== image.id)
                  : [...existing, image];
                return {
                  ...v,
                  images: updated,
                  imageIds: updated.map((i) => i.id),
                };
              })
            );
          } else {
            setSelectedImages((prev) =>
              prev.some((img) => img.id === image.id)
                ? prev.filter((img) => img.id !== image.id)
                : [...prev, image]
            );
          }
        }}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
      />

      <ImageUploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onImageSaved={(imgObj) => {
          const imageItem =
            typeof imgObj === 'string'
              ? { id: imgObj, url: '' }
              : imgObj;

          if (activeVariantForImage) {
            setVariants((prev) =>
              prev.map((v) => {
                if (v.id !== activeVariantForImage) return v;
                const updated = [...(v.images || []), imageItem];
                return {
                  ...v,
                  images: updated,
                  imageIds: updated.map((i) => i.id),
                };
              })
            );
          } else {
            setSelectedImages((prev) => [...prev, imageItem]);
          }
        }}
      />
    </div>
  );
};

export default ProductCreateVariableTab;
