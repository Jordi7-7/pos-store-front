import React, { useMemo, useState } from 'react';
import { Layers, Loader2, Package, Save } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAttributes } from '../hooks/useAttributes';
import { useCategories } from '../hooks/useCategories';
import { useImagePicker } from '../hooks/useImagePicker';
import { useParentInfoForm } from '../hooks/useParentInfoForm';
import { useProductDetail } from '../hooks/useProductDetail';
import { useProductMutations } from '../hooks/useProductMutations';
import { useVariantRows } from '../hooks/useVariantRows';
import type { NewVariantInput } from '../../application/ports/products.repository';
import { attributesUsedBy } from '../../domain/rules/product-attributes';
import { suggestNewVariant, type VariantSuggestion } from '../../domain/rules/variant-suggestion';
import { BulkAssignPanel } from './variable-edit/BulkAssignPanel';
import { ImagePickerModals } from './variable-edit/ImagePickerModals';
import { NewVariantDialog } from './variable-edit/NewVariantDialog';
import { ParentInfoTab } from './variable-edit/ParentInfoTab';
import { VariantsTable } from './variable-edit/VariantsTable';

interface ProductVariableEditModalProps {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
  selectedBranchId?: string;
}

type EditorTab = 'info' | 'variants';

/**
 * Editor de un producto compuesto: ficha del padre, variantes y precios. Este componente solo junta
 * las piezas: el estado del formulario y de las filas vive en sus hooks, y cada pieza guarda el
 * estado que solo ella usa (asignación masiva, formulario de variante nueva, alta de categoría).
 */
export const ProductVariableEditModal: React.FC<ProductVariableEditModalProps> = ({ productId, isOpen, onClose, selectedBranchId }) => {
  const { product, isLoading: isLoadingProduct } = useProductDetail(productId || undefined, isOpen && Boolean(productId));
  const { updateProduct, isUpdatingProduct, createVariant, isCreatingVariant } = useProductMutations();
  const { categories, createCategory, isCreating: isCreatingCategory } = useCategories();
  const { attributes } = useAttributes();

  const [activeTab, setActiveTab] = useState<EditorTab>('info');
  const parent = useParentInfoForm(product, isOpen);
  const variants = useVariantRows(product, isOpen);
  const picker = useImagePicker({ parentImages: parent.images, setParentImages: parent.setImages, rows: variants.rows, setRowImages: variants.setRowImages });

  const [isAddVariantOpen, setIsAddVariantOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<VariantSuggestion | null>(null);
  const productAttributes = useMemo(() => attributesUsedBy(product?.variants ?? [], attributes), [product, attributes]);

  const openAddVariant = () => {
    const first = variants.rows[0];
    setSuggestion(suggestNewVariant({ skus: variants.rows.map((row) => row.sku), productName: product?.name ?? '', firstPrices: first }));
    setIsAddVariantOpen(true);
  };

  const submitNewVariant = async (input: NewVariantInput) => {
    if (!productId) return;
    try {
      const created = await createVariant({ productId, input });
      variants.appendCreated(created);
      setIsAddVariantOpen(false);
      toast.success(`¡Variante "${created.sku}" creada con éxito!`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al crear la variante.'));
    }
  };

  const saveParent = async () => {
    if (!productId) return;
    const values = parent.getValues();
    if (!values.name.trim()) {
      toast.warning('El nombre del producto no puede estar vacío.');
      return;
    }
    try {
      await updateProduct({
        id: productId,
        input: {
          name: values.name.trim(),
          baseSku: values.baseSku?.trim() ? values.baseSku.trim().toUpperCase() : null,
          description: values.description.trim(),
          categoryId: values.categoryId || null,
          imageIds: parent.images.map((image) => image.id),
        },
      });
      toast.success('¡Información del producto padre guardada con éxito!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al actualizar el producto.'));
    }
  };

  const saveAllAndClose = async () => {
    await saveParent();
    if (variants.hasChanges) await variants.saveChanged();
    onClose();
  };

  const isSaving = isUpdatingProduct || variants.isBusy;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:max-w-5xl! h-[calc(100vh-2rem)] max-h-[850px] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl shadow-2xl bg-card border border-border">
        <DialogHeader className="shrink-0 px-6 pr-14 py-4 border-b border-border bg-muted/25 flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <DialogTitle className="text-base font-bold text-secondary flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Editar Producto Compuesto
              </DialogTitle>
              <Badge variant="outline" className="text-[10px] font-mono">
                {variants.rows.length} variantes
              </Badge>
            </div>
            <DialogDescription className="text-xs text-neutral mt-0.5">
              Modifica la ficha general o actualiza individualmente los precios y códigos de cada variante sin desarmar el producto.
            </DialogDescription>
          </div>
        </DialogHeader>

        {isLoadingProduct ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-xs text-neutral">Cargando producto y variantes...</span>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-3 border-b border-border bg-card">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as EditorTab)}>
                <TabsList className="bg-muted/40 p-1 mb-2 border border-border/40">
                  <TabsTrigger value="info" className="gap-2 text-xs font-semibold data-[state=active]:shadow-xs">
                    <Package className="w-4 h-4 text-primary" />
                    1. Ficha General del Padre
                  </TabsTrigger>
                  <TabsTrigger value="variants" className="gap-2 text-xs font-semibold data-[state=active]:shadow-xs">
                    <Layers className="w-4 h-4 text-primary" />
                    2. Variantes y Precios ({variants.rows.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeTab === 'info' && (
                <div className="space-y-5">
                  <ParentInfoTab
                    control={parent.control}
                    categories={categories}
                    createCategory={createCategory}
                    isCreatingCategory={isCreatingCategory}
                    images={parent.images}
                    onImagesChange={parent.setImages}
                    onOpenGallery={picker.openForParent}
                    onOpenUpload={picker.openUpload}
                  />
                </div>
              )}

              {activeTab === 'variants' && (
                <div className="space-y-5">
                  <BulkAssignPanel onApply={variants.applyBulk} />
                  <VariantsTable
                    rows={variants.rows}
                    currentBaseSku={parent.currentBaseSku}
                    savedBaseSku={product?.baseSku ?? ''}
                    isDeleting={variants.isDeleting}
                    onChangeField={variants.updateField}
                    onDelete={variants.remove}
                    onPickImage={picker.openForVariant}
                    onAddVariant={openAddVariant}
                  />
                </div>
              )}
            </div>

            <div className="shrink-0 px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
              <Button type="button" variant="ghost" onClick={onClose} className="text-xs cursor-pointer">
                Cancelar
              </Button>
              <Button type="button" onClick={saveAllAndClose} disabled={isSaving} className="h-9 px-5 text-xs font-bold gap-1.5 shadow-sm shadow-primary/20 cursor-pointer">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Todos los Cambios
              </Button>
            </div>
          </div>
        )}

        <ImagePickerModals picker={picker} />

        {suggestion && (
          <NewVariantDialog
            open={isAddVariantOpen}
            onOpenChange={setIsAddVariantOpen}
            suggestion={suggestion}
            attributes={productAttributes}
            branchId={selectedBranchId}
            isSubmitting={isCreatingVariant}
            onSubmit={submitNewVariant}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
