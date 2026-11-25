import React from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAttributes } from '../hooks/useAttributes';
import { useCategories } from '../hooks/useCategories';
import { useVariableProductForm } from '../hooks/useVariableProductForm';
import { hasBlockingIssues } from '../../domain/rules/variable-wizard';
import { ImageUploadModal } from './forms/ImageUploadModal';
import { MediaGallerySelectorModal } from './forms/MediaGallerySelectorModal';
import { AttributePicker, ProductHeaderCard, VariantsMatrix } from './variable-create';

interface ProductCreateVariableTabProps {
  selectedBranchId: string;
  onSuccess?: () => void;
  onNavigateToAttributes?: () => void;
}

/**
 * Alta de producto con variantes en una sola pantalla: datos del producto, opciones (talla, color…) y la tabla de variantes,
 * que se arma sola al marcar opciones y conserva lo ya escrito. El estado vive en `useVariableProductForm`.
 */
export const ProductCreateVariableTab: React.FC<ProductCreateVariableTabProps> = ({ selectedBranchId, onSuccess, onNavigateToAttributes }) => {
  const { categories, createCategory, isCreating: isCreatingCategory } = useCategories();
  const { attributes, isLoading: isLoadingAttributes, createAttribute, isCreatingAttribute, createAttributeValue, isCreatingValue } = useAttributes();
  const product = useVariableProductForm({ branchId: selectedBranchId, attributes, onSuccess });
  const { images, rows } = product;

  const totalStock = rows.reduce((sum, row) => sum + (Number(row.initialStock) || 0), 0);
  const blocked = hasBlockingIssues(product.issues);
  const shownMessages = product.blockingMessages.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {!selectedBranchId && (
        <div role="status" className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Estás viendo <strong>todas las sucursales</strong>. Elige una en la barra superior: el stock inicial de las variantes se guarda en ella, y sin sucursal no se puede guardar.
          </span>
        </div>
      )}

      <ProductHeaderCard
        control={product.form.control}
        errors={product.form.formState.errors}
        categories={categories}
        createCategory={createCategory}
        isCreatingCategory={isCreatingCategory}
        selectedImages={images.productImages}
        onRemoveImage={images.removeProductImage}
        onOpenGalleryModal={images.openGalleryForProduct}
        onOpenUploadModal={images.openUploadForProduct}
        onNameBlur={product.suggestSkuFromName}
      />

      <AttributePicker
        attributes={attributes}
        isLoadingAttributes={isLoadingAttributes}
        selectedAttributeValues={product.selectedValues}
        activeAttributeIds={product.activeAttributeIds}
        onActivateAttribute={product.activateAttribute}
        onDeactivateAttribute={product.deactivateAttribute}
        onToggleValue={product.toggleValue}
        createAttribute={createAttribute}
        isCreatingAttribute={isCreatingAttribute}
        createAttributeValue={createAttributeValue}
        isCreatingValue={isCreatingValue}
        onNavigateToAttributes={onNavigateToAttributes}
      />

      <VariantsMatrix
        rows={rows}
        issues={product.issues}
        takenSkus={product.takenSkus}
        removedCount={product.removedCount}
        bulk={product.bulk}
        onBulkChange={product.setBulkField}
        onApplyBulk={product.applyBulk}
        onUpdateField={product.updateField}
        onRemoveRow={product.removeRow}
        onRestoreRemoved={product.restoreRemoved}
        onOpenVariantGallery={images.openGalleryForVariant}
        onPaste={product.pasteCells}
      />

      <div className="sticky bottom-0 z-20 -mx-1 flex flex-col items-stretch justify-between gap-3 rounded-xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center">
        <div className="space-y-1 text-xs text-neutral">
          <p>
            <strong className="text-foreground">{rows.length}</strong> {rows.length === 1 ? 'variante' : 'variantes'} · <strong className="text-foreground">{totalStock}</strong> unidades de stock inicial
          </p>
          {blocked && (
            <ul role="alert" className="space-y-0.5 font-medium text-destructive">
              {shownMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
              {product.blockingMessages.length > shownMessages.length && <li>…y {product.blockingMessages.length - shownMessages.length} más</li>}
            </ul>
          )}
        </div>
        <Button type="button" onClick={product.submit} disabled={product.isSubmitting} className="h-10 cursor-pointer px-6 text-xs font-bold">
          {product.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar producto{rows.length > 0 ? ` con ${rows.length} ${rows.length === 1 ? 'variante' : 'variantes'}` : ''}
        </Button>
      </div>

      <MediaGallerySelectorModal
        open={images.isGalleryOpen}
        onOpenChange={images.setGalleryOpen}
        selectedImages={images.selectedInGallery}
        onToggleImage={images.toggleImage}
        onOpenUploadModal={() => images.setUploadOpen(true)}
      />
      <ImageUploadModal open={images.isUploadOpen} onOpenChange={images.setUploadOpen} onImageSaved={images.addUploaded} />
    </div>
  );
};

export default ProductCreateVariableTab;
