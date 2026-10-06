/**
 * ProductCreateTab — container component.
 *
 * Responsibilities:
 *  - Owns form state (useForm)
 *  - Owns image selection state
 *  - Calls the createSimpleProduct mutation on submit
 *  - Renders the shared <ProductForm /> + <ImageUploadModal />
 */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useCategories } from '../hooks/useCategories';
import { useTags } from '../hooks/useTags';
import { productFormSchema, productFormDefaults, type ProductFormValues } from '../schemas/product.schema';
import { ProductForm } from './forms/ProductForm';
import { ImageUploadModal } from './forms/ImageUploadModal';
import { MediaGallerySelectorModal } from './forms/MediaGallerySelectorModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ProductCreateTabProps {
  categories: any[];
  uploadedImages?: any[];
  selectedBranchId: string;
  createSimpleProduct: (input: any) => Promise<any>;
  onSuccess: () => void;
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------
export const ProductCreateTab: React.FC<ProductCreateTabProps> = ({
  categories,
  selectedBranchId,
  createSimpleProduct,
  onSuccess,
}) => {
  const { createCategory, isCreating: isCreatingCategory } = useCategories();
  const { tags: allTags, createTag, isCreating: isCreatingTag, updateVariantTags } = useTags();

  // ── Form instance ────────────────────────────────────────────────────────
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: productFormDefaults,
  });

  // ── Image selection ──────────────────────────────────────────────────────
  const [selectedImages, setSelectedImages] = useState<{ id: string; url: string; description?: string }[]>([]);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // ── Tag selection ────────────────────────────────────────────────────────
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const handleToggleTag = (tagId: string) =>
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );

  const handleToggleImage = (image: { id: string; url: string; description?: string }) => {
    setSelectedImages((prev) =>
      prev.some((img) => img.id === image.id)
        ? prev.filter((img) => img.id !== image.id)
        : [...prev, image]
    );
  };

  const handleRemoveImage = (id: string) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleImageSaved = (imageObj: { id: string; url: string; description?: string } | string) => {
    if (typeof imageObj === 'string') {
      // Legacy id fallback
      setSelectedImages((prev) => [...prev, { id: imageObj, url: '' }]);
    } else {
      setSelectedImages((prev) => [...prev, imageObj]);
    }
  };

  // ── Inline category creation ─────────────────────────────────────────────
  const [isCreatingCategoryInline, setIsCreatingCategoryInline] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.warning('Por favor ingresa un nombre para la categoría.');
      return;
    }
    try {
      const newCat = await createCategory(newCategoryName.trim());
      form.setValue('categoryId', newCat.id);
      setNewCategoryName('');
      setIsCreatingCategoryInline(false);
      toast.success('¡Categoría creada e incorporada al producto!');
    } catch (e: any) {
      toast.error(e.message || 'Error al crear la categoría.');
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const onSubmit = async (data: ProductFormValues) => {
    try {
      const newProduct = await createSimpleProduct({
        name: data.name.trim(),
        description: data.description?.trim() ?? '',
        categoryId: data.categoryId || undefined,
        imageIds: selectedImages.map((img) => img.id),
        sku: data.sku.trim(),
        barcode: data.barcode?.trim() || undefined,
        purchasePrice: data.purchasePrice,
        salePrice: data.salePrice,
        wholesalePrice: data.wholesalePrice !== undefined ? data.wholesalePrice : null,
        stocks: selectedBranchId
          ? [{ branchId: selectedBranchId, quantity: data.initialStock }]
          : [],
      });
      // Assign tags to the first variant of the newly created product
      const newVariantId = newProduct?.variants?.[0]?.id;
      if (newVariantId && selectedTagIds.length > 0) {
        await updateVariantTags({ variantId: newVariantId, tagIds: selectedTagIds });
      }
      toast.success('¡Producto e inventario registrados con éxito!');
      form.reset(productFormDefaults);
      setSelectedImages([]);
      setSelectedTagIds([]);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al registrar el producto en el servidor.');
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Ficha del Producto</CardTitle>
          <CardDescription className="text-xs">
            Información base de catalogación general y de inventario.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <ProductForm
            form={form}
            formId="product-create-form"
            onSubmit={onSubmit}
            categories={categories}
            selectedImages={selectedImages}
            onRemoveImage={handleRemoveImage}
            onOpenGalleryModal={() => setIsGalleryModalOpen(true)}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            isCreatingCategoryInline={isCreatingCategoryInline}
            onToggleCategoryInline={() => setIsCreatingCategoryInline((p) => !p)}
            newCategoryName={newCategoryName}
            onNewCategoryNameChange={setNewCategoryName}
            onCreateCategory={handleCreateCategory}
            isCreatingCategory={isCreatingCategory}
            allTags={allTags}
            selectedTagIds={selectedTagIds}
            onToggleTag={handleToggleTag}
            onCreateTag={createTag}
            isCreatingTag={isCreatingTag}
          />

          <Button
            type="submit"
            form="product-create-form"
            disabled={form.formState.isSubmitting}
            className="w-full"
          >
            {form.formState.isSubmitting && (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            )}
            Crear Producto e Inventario
          </Button>
        </CardContent>
      </Card>

      <MediaGallerySelectorModal
        open={isGalleryModalOpen}
        onOpenChange={setIsGalleryModalOpen}
        selectedImages={selectedImages}
        onToggleImage={handleToggleImage}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
      />

      <ImageUploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onImageSaved={handleImageSaved}
      />
    </div>
  );
};

export default ProductCreateTab;
