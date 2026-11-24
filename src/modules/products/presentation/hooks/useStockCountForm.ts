import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isApiError } from '@/shared/infrastructure/http/api-error';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import { inventoryRepository } from '../../infrastructure/dependencies';
import type { InventoryDocumentEntity } from '../../domain/entities/inventory.entity';
import { addCountLine, countBlocker, countSummary, MAX_COUNT_LINES, mergeSheetItems, removeCountLine, removeUncountedLines, toCountLines, updateCountLine, type CountFormLine, type NewCountLine } from '../../domain/rules/stock-count-lines';
import { useInvalidateInventory } from './useInvalidateInventory';
import { useSkuLookup } from './useSkuLookup';

/** Producto cuyo stock ya no es el que el usuario veía al agregarlo. */
export interface StockChange {
  variantId: string;
  sku: string;
  expected: number;
  current: number;
}

const STOCK_CHANGED = 'STOCK_CHANGED_SINCE_COUNT';
const SHEET_PAGE_SIZE = 100;
/** Tope de páginas por carga: evita recorrer un catálogo enorme cuando casi todo ya estaba agregado. */
const SHEET_MAX_PAGES = 100;

export interface SheetFilters {
  categoryId?: string;
  onlyWithStock: boolean;
}

const parseChanges = (details: unknown): StockChange[] => {
  const lines = (details as { lines?: unknown } | null | undefined)?.lines;
  if (!Array.isArray(lines)) return [];
  return lines.flatMap((item: unknown) => {
    const { variantId, sku, expected, current } = item as Record<string, unknown>;
    return typeof variantId === 'string' && typeof sku === 'string' && typeof expected === 'number' && typeof current === 'number' ? [{ variantId, sku, expected, current }] : [];
  });
};

/**
 * Formulario de un conteo físico: se agregan productos por SKU (guardando lo que decía el sistema), se escribe lo contado y se confirma.
 * Si el stock cambió mientras tanto, el servidor lo avisa y el usuario decide si aplicar la diferencia contada sobre el stock de ahora.
 * Reintentar un envío que falló reutiliza el mismo `clientRequestId`; si cambia algo, se genera otro.
 */
export function useStockCountForm(branchId: string, onCreated: (document: InventoryDocumentEntity) => void) {
  const invalidateInventory = useInvalidateInventory();
  const { find, isSearching } = useSkuLookup(branchId);
  const [lines, setLines] = useState<CountFormLine[]>([]);
  const [comment, setComment] = useState('');
  const [changes, setChanges] = useState<StockChange[]>([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const attempt = useRef<{ signature: string; key: string } | null>(null);

  const mutation = useMutation({
    mutationFn: (acceptStockChanges: boolean) => {
      const request = { branchId, comment: comment.trim() || undefined, lines: toCountLines(lines), acceptStockChanges };
      const signature = JSON.stringify(request);
      if (attempt.current?.signature !== signature) attempt.current = { signature, key: crypto.randomUUID() };
      return inventoryRepository.createStockCount({ ...request, clientRequestId: attempt.current.key });
    },
    onSuccess: (document) => {
      attempt.current = null;
      setChanges([]);
      invalidateInventory();
      onCreated(document);
    },
    onError: (error) => {
      if (isApiError(error) && error.code === STOCK_CHANGED) {
        setChanges(parseChanges(error.details));
        return;
      }
      toast.error(getErrorMessage(error, 'No se pudo registrar el conteo.'));
    },
  });

  /** Busca el SKU (o código de barras) en la sucursal y lo agrega con la existencia que muestra el sistema ahora. */
  const addBySku = async (rawSku: string): Promise<boolean> => {
    const variant = await find(rawSku, 'contar');
    if (!variant) return false;
    const product: NewCountLine = { variantId: variant.id, sku: variant.sku, productName: variant.productName, expected: Number(variant.stock || 0), referenceCost: Number(variant.purchasePrice || 0) };
    const next = addCountLine(lines, product);
    if (!next.added) {
      toast.info(`${variant.sku} ya está en el conteo.`);
      return false;
    }
    setLines(next.lines);
    setChanges([]);
    return true;
  };

  /**
   * Agrega los productos de la sucursal (por categoría y/o solo con existencias) para contarlos sin escribirlos uno a uno.
   * Recorre las páginas hasta terminar o llegar al tope de líneas del conteo; los que ya estaban no se duplican.
   */
  const loadFromBranch = async (filters: SheetFilters): Promise<void> => {
    setIsLoadingSheet(true);
    try {
      let working = lines;
      let added = 0;
      let skipped = 0;
      let full = false;
      let after: string | undefined;
      for (let page = 0; page < SHEET_MAX_PAGES; page++) {
        const result = await inventoryRepository.stockCountSheet({ branchId, categoryId: filters.categoryId, onlyWithStock: filters.onlyWithStock, after, limit: SHEET_PAGE_SIZE });
        const merged = mergeSheetItems(working, result.items);
        working = merged.lines;
        added += merged.added;
        skipped += merged.skipped;
        if (merged.full) {
          full = true;
          break;
        }
        if (!result.nextAfter) break;
        after = result.nextAfter;
        if (page === SHEET_MAX_PAGES - 1) full = true;
      }
      setLines(working);
      setChanges([]);
      if (added === 0 && !full) toast.info(skipped > 0 ? 'Todos esos productos ya están en el conteo.' : 'No hay productos con esos filtros en la sucursal.');
      else toast.success(`Se agregaron ${added} producto(s)${skipped > 0 ? ` (${skipped} ya estaban)` : ''}.`);
      if (full) toast.warning(`Se llegó al tope de ${MAX_COUNT_LINES} productos por conteo. Cuéntalos, confirma y carga el resto en otro conteo.`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudieron cargar los productos de la sucursal.'));
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const edit = (change: (current: CountFormLine[]) => CountFormLine[]) => {
    setLines(change);
    setChanges([]);
  };

  return {
    lines,
    comment,
    setComment,
    isSearching,
    isLoadingSheet,
    isSaving: mutation.isPending,
    summary: countSummary(lines),
    blocker: countBlocker(lines),
    /** Productos cuyo stock cambió desde que se agregaron; mientras haya, se pide confirmar. */
    changes,
    addBySku,
    loadFromBranch,
    /** Quita los productos aún sin contar. */
    removeUncounted: () => edit((current) => removeUncountedLines(current)),
    setCounted: (variantId: string, counted: number | undefined) => edit((current) => updateCountLine(current, variantId, { counted })),
    setUnitCost: (variantId: string, unitCost: number | undefined) => edit((current) => updateCountLine(current, variantId, { unitCost })),
    removeLine: (variantId: string) => edit((current) => removeCountLine(current, variantId)),
    submit: () => mutation.mutate(false),
    /** El usuario revisó los cambios de stock y quiere aplicar la diferencia contada sobre el stock de ahora. */
    confirmChanges: () => mutation.mutate(true),
  };
}
