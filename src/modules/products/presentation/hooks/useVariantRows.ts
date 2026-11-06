import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import type { CreatedVariantEntity } from '../../domain/entities/catalog.entity';
import {
  applyBulkPrices,
  mergeEditableRows,
  toEditableRow,
  toVariantUpdate,
  validateRowsForSave,
  type BulkPrices,
  type EditableVariantRow,
} from '../../domain/rules/variant-rows';
import type { ProductVM } from '../view-models/product.vm';
import { useProductMutations } from './useProductMutations';

/**
 * Filas de la tabla de variantes del editor: edición local, asignación masiva, baja y guardado.
 * Al recargar el mismo producto conserva lo editado y aún no guardado.
 */
export function useVariantRows(product: ProductVM | null, isOpen: boolean) {
  const { updateVariant, isUpdatingVariant, deleteVariant, isDeletingVariant } = useProductMutations();
  const [rows, setRows] = useState<EditableVariantRow[]>([]);
  const loadedProductId = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      loadedProductId.current = null;
      return;
    }
    if (!product) return;
    const fromServer = product.variants.map(toEditableRow);
    if (loadedProductId.current === product.id) {
      setRows((current) => mergeEditableRows(current, fromServer));
    } else {
      loadedProductId.current = product.id;
      setRows(fromServer);
    }
  }, [product, isOpen]);

  const updateField = (id: string, field: keyof EditableVariantRow, value: string | number | null) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value, hasChanged: true } : row)));

  const applyBulk = (prices: BulkPrices) => {
    if (rows.length === 0) return;
    setRows((current) => applyBulkPrices(current, prices));
    toast.success('Valores aplicados masivamente a las variantes en pantalla.');
  };

  const setRowImages = (id: string, images: NonNullable<EditableVariantRow['images']>) =>
    setRows((current) => current.map((row) => (row.id === id ? { ...row, images, imageIds: images.map((image) => image.id), hasChanged: true } : row)));

  const remove = async (id: string, sku: string) => {
    if (rows.length <= 1) {
      toast.warning('No puedes eliminar la última variante restante del producto.');
      return;
    }
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la variante "${sku}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteVariant(id);
      setRows((current) => current.filter((row) => row.id !== id));
      toast.success(`Variante "${sku}" eliminada con éxito.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al eliminar la variante.'));
    }
  };

  /** Guarda las filas modificadas. Devuelve `true` si no quedó nada pendiente por un error. */
  const saveChanged = async (): Promise<boolean> => {
    const changed = rows.filter((row) => row.hasChanged);
    if (changed.length === 0) {
      toast.info('No se han modificado variantes.');
      return true;
    }
    const validation = validateRowsForSave(rows);
    if (!validation.ok) {
      toast.error(validation.message);
      return false;
    }
    try {
      for (const row of changed) await updateVariant({ variantId: row.id, input: toVariantUpdate(row) });
      setRows((current) => current.map((row) => ({ ...row, hasChanged: false })));
      toast.success(`¡Se actualizaron ${changed.length} variante(s) con éxito!`);
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al guardar los cambios en las variantes.'));
      return false;
    }
  };

  const appendCreated = (created: CreatedVariantEntity) =>
    setRows((current) => [
      ...current,
      {
        id: created.id || String(Date.now()),
        sku: created.sku,
        barcode: created.barcode,
        purchasePrice: created.purchasePrice,
        salePrice: created.salePrice,
        wholesalePrice: created.wholesalePrice,
        combinationText: created.attributes.map((attribute) => `${attribute.name}: ${attribute.value}`).join(' · ') || 'Nueva Variante',
        images: created.images,
        imageIds: created.images.map((image) => image.id),
        hasChanged: false,
      },
    ]);

  return {
    rows,
    hasChanges: rows.some((row) => row.hasChanged),
    isBusy: isUpdatingVariant,
    isDeleting: isDeletingVariant,
    updateField,
    applyBulk,
    setRowImages,
    remove,
    saveChanged,
    appendCreated,
  };
}
