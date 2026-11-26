import { useMemo, useState } from 'react';
import type React from 'react';
import { toast } from 'sonner';
import type { ScanFeedback } from '@/shared/presentation/components/BarcodeScannerDialog';
import { useVariantSearch } from '@/modules/products/presentation/hooks';
import { addScannedProduct, assignProduct, emptyPurchaseLine, purchaseTotal, removeLine, type PurchaseLine } from '../../domain/rules/purchase-lines';

type Column = 'sku' | 'quantity' | 'unitCost';

const cell = (row: number, col: Column) => document.querySelector<HTMLInputElement>(`[data-row="${row}"][data-col="${col}"]`);

const focusCell = (row: number, col: Column, delay: number, select = false) => {
  setTimeout(() => {
    const input = cell(row, col);
    input?.focus();
    if (select) input?.select();
  }, delay);
};

/** Filas del ingreso de mercancía: alta por SKU, edición y movimiento con el teclado. Las reglas viven en `purchase-lines`. */
export function usePurchaseLines() {
  const { findVariantBySku } = useVariantSearch();
  const [lines, setLines] = useState<PurchaseLine[]>([emptyPurchaseLine()]);

  const updateRow = (index: number, fields: Partial<PurchaseLine>) =>
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...fields } : line)));

  const addRow = () => setLines((prev) => [...prev, emptyPurchaseLine()]);
  const removeRow = (index: number) => setLines((prev) => removeLine(prev, index));
  const reset = () => setLines([emptyPurchaseLine()]);

  const selectProduct = async (index: number, sku: string | null) => {
    if (!sku) {
      updateRow(index, { variantId: '', variantSku: '', productName: '', unitCost: 0 });
      return;
    }
    const trimmed = sku.trim();
    if (!trimmed) return;
    try {
      const variant = await findVariantBySku(trimmed);
      if (!variant?.id) throw new Error('Producto no encontrado');
      setLines((prev) => assignProduct(prev, index, variant));
      focusCell(index + 1, 'sku', 80, true);
    } catch {
      toast.error(`Error: El SKU "${trimmed}" no se encuentra en el catálogo.`);
      focusCell(index, 'sku', 50, true);
    }
  };

  /** Un código escaneado con la cámara: suma el producto al ingreso (o una unidad más si ya estaba). */
  const scan = async (code: string): Promise<ScanFeedback> => {
    try {
      const variant = await findVariantBySku(code);
      if (!variant?.id) throw new Error('Producto no encontrado');
      setLines((prev) => addScannedProduct(prev, variant));
      return { status: 'ok', message: `${variant.productName} agregado` };
    } catch {
      return { status: 'error', message: `El código ${code} no existe` };
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, row: number, col: Column) => {
    const isLast = row === lines.length - 1;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const next = cell(row + 1, col);
      if (next) {
        next.focus();
        next.select();
      } else if (isLast) {
        addRow();
        focusCell(row + 1, 'sku', 50);
      }
    } else if (event.key === 'ArrowUp' && row > 0) {
      event.preventDefault();
      const previous = cell(row - 1, col);
      previous?.focus();
      previous?.select();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (col === 'sku') {
        void selectProduct(row, event.currentTarget.value);
      } else if (col === 'quantity') {
        if (isLast) addRow();
        focusCell(row + 1, 'sku', isLast ? 50 : 0);
      }
    }
  };

  const total = useMemo(() => purchaseTotal(lines), [lines]);

  return { lines, total, updateRow, addRow, removeRow, selectProduct, scan, onKeyDown, reset };
}
