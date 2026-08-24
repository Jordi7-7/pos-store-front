/**
 * ProductEditDrawer — container component.
 *
 * Responsibilities:
 *  - Owns form state (useForm)
 *  - Populates the form when `product` changes (useEffect)
 *  - Owns image selection state
 *  - Calls updateProduct / deleteProduct mutations
 *  - Renders the shared <ProductForm /> + <ImageUploadModal />
 *    plus the delete-confirmation dialog
 */
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

import { useCategories } from '../hooks/useCategories';
import { useUpdateProduct, useDeleteProduct } from '../hooks/useProducts';
import { productFormSchema, type ProductFormValues } from '../schemas/product.schema';
import { ProductForm } from './forms/ProductForm';
import { ImageUploadModal } from './forms/ImageUploadModal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface ProductEditDrawerProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  uploadedImages: any[];
  selectedBranchId: string;
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------
export const ProductEditDrawer: React.FC<ProductEditDrawerProps> = ({
  product,
  isOpen,
  onClose,
  categories,
  uploadedImages,
  selectedBranchId,
}) => {
  const { createCategory, isCreating: isCreatingCategory } = useCategories();
  const { updateProduct, isUpdating } = useUpdateProduct();
  const { deleteProduct, isDeleting } = useDeleteProduct();

  // ── Form instance ────────────────────────────────────────────────────────
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      sku: '',
      purchasePrice: 0,
      salePrice: 0,
      initialStock: 0,
    },
  });

  // ── Populate form when product prop changes ──────────────────────────────
  useEffect(() => {
    if (!product) return;
    const sv = product.variants?.[0] ?? {};
    const stockQty =
      sv.stocks?.find((s: any) => s.branchId === selectedBranchId)?.quantity ?? 0;

    form.reset({
      name: product.name ?? '',
      description: product.description ?? '',
      categoryId: product.categoryId ?? '',
      sku: sv.sku ?? '',
      barcode: sv.barcode ?? '',
      purchasePrice: sv.purchasePrice ?? 0,
      salePrice: sv.salePrice ?? 0,
      initialStock: stockQty,
    });

    setSelectedImages(product.images?.map((img: any) => img.id) ?? []);
  }, [product, selectedBranchId, form]);

  // ── Image selection ──────────────────────────────────────────────────────
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleToggleImage = (id: string) =>
    setSelectedImages((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleImageSaved = (imageId: string) =>
    setSelectedImages((prev) => [...prev, imageId]);

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
    const sv = product?.variants?.[0] ?? {};
    try {
      await updateProduct({
        id: product.id,
        input: {
          name: data.name.trim(),
          description: data.description?.trim() ?? '',
          categoryId: data.categoryId || undefined,
          imageIds: selectedImages,
          variants: [
            {
              id: sv.id,
              sku: data.sku.trim(),
              barcode: data.barcode?.trim() || undefined,
              purchasePrice: data.purchasePrice,
              salePrice: data.salePrice,
              imageIds: selectedImages,
              stocks: selectedBranchId
                ? [{ branchId: selectedBranchId, quantity: data.initialStock }]
                : [],
            },
          ],
        },
      });
      toast.success('¡Producto actualizado con éxito!');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar los cambios en el servidor.');
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
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

  if (!isOpen || !product) return null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-background border-l border-border z-[45] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-bold">Editar Producto</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Modifica los detalles generales, precios y stock del artículo.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">
          <ProductForm
            form={form}
            formId="product-edit-form"
            onSubmit={onSubmit}
            categories={categories}
            uploadedImages={uploadedImages}
            selectedImages={selectedImages}
            onToggleImage={handleToggleImage}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            isCreatingCategoryInline={isCreatingCategoryInline}
            onToggleCategoryInline={() => setIsCreatingCategoryInline((p) => !p)}
            newCategoryName={newCategoryName}
            onNewCategoryNameChange={setNewCategoryName}
            onCreateCategory={handleCreateCategory}
            isCreatingCategory={isCreatingCategory}
            isEdit={true}
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/10 flex justify-between gap-4 shrink-0">
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
              form="product-edit-form"
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

      {/* ── Delete confirmation dialog ──────────────────────────────────── */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <DialogTitle className="text-sm">
                ¿Estás seguro de eliminar el producto?
              </DialogTitle>
              <DialogDescription className="text-xs">
                Esta acción es irreversible y eliminará todo el historial de inventario
                (Kardex) asociado a este artículo.
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
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Quick upload dialog ─────────────────────────────────────────── */}
      <ImageUploadModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        onImageSaved={handleImageSaved}
      />
    </>
  );
};

export default ProductEditDrawer;
