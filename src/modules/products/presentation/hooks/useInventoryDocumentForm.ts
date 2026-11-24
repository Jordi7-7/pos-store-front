import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { InventoryDocumentKind } from '../../domain/enums';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import { inventoryRepository } from '../../infrastructure/dependencies';
import type { InventoryDocumentEntity } from '../../domain/entities/inventory.entity';
import {
  addDocumentLine,
  documentBlocker,
  documentSummary,
  lineShortages,
  removeDocumentLine,
  toDocumentLines,
  transferBranchBlocker,
  updateDocumentLine,
  type DocumentFormLine,
  type LinesKind,
  type NewDocumentLine,
} from '../../domain/rules/inventory-document-lines';
import { useInvalidateInventory } from './useInvalidateInventory';
import { useSkuLookup } from './useSkuLookup';

/**
 * Formulario de una entrada o salida manual: líneas por SKU, motivo, comentario y envío. Reintentar un envío
 * que falló reutiliza el mismo `clientRequestId` (no se duplica si la primera sí llegó); si cambia algo, se genera otro.
 */
export function useInventoryDocumentForm(kind: LinesKind, branchId: string, onCreated: (document: InventoryDocumentEntity) => void) {
  const invalidateInventory = useInvalidateInventory();
  const { find, isSearching } = useSkuLookup(branchId);
  const [lines, setLines] = useState<DocumentFormLine[]>([]);
  const [reason, setReason] = useState<string | undefined>();
  const [comment, setComment] = useState('');
  /** Solo en traslados; vacío = aún sin elegir. */
  const [destinationBranchId, setDestinationBranchId] = useState('');
  const attempt = useRef<{ signature: string; key: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () => {
      const request = { branchId, kind, reason: reason ?? '', comment: comment.trim() || undefined, lines: toDocumentLines(lines, kind), destinationBranchId };
      const signature = JSON.stringify(request);
      if (attempt.current?.signature !== signature) attempt.current = { signature, key: crypto.randomUUID() };
      const clientRequestId = attempt.current.key;
      if (kind === InventoryDocumentKind.TRANSFER) {
        return inventoryRepository.createTransfer({ originBranchId: branchId, destinationBranchId, comment: request.comment, lines: request.lines, clientRequestId });
      }
      return inventoryRepository.createDocument({ branchId, kind, reason: request.reason, comment: request.comment, lines: request.lines, clientRequestId });
    },
    onSuccess: (document) => {
      attempt.current = null;
      invalidateInventory();
      onCreated(document);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo registrar el movimiento.')),
  });

  /** Busca el SKU (o código de barras) en la sucursal y lo agrega. Un SKU base con varias variantes pide elegir una. */
  const addBySku = async (rawSku: string): Promise<boolean> => {
    const variant = await find(rawSku, 'mover');
    if (!variant) return false;
    const product: NewDocumentLine = { variantId: variant.id, sku: variant.sku, productName: variant.productName, referenceCost: Number(variant.purchasePrice || 0), stock: Number(variant.stock || 0) };
    setLines((current) => addDocumentLine(current, product));
    return true;
  };

  return {
    lines,
    reason,
    setReason,
    comment,
    setComment,
    isSearching,
    isSaving: mutation.isPending,
    destinationBranchId,
    setDestinationBranchId,
    summary: documentSummary(lines),
    shortages: lineShortages(lines, kind),
    blocker: (kind === InventoryDocumentKind.TRANSFER ? transferBranchBlocker(branchId, destinationBranchId) : null) ?? documentBlocker(kind, lines, reason, comment),
    addBySku,
    setQuantity: (variantId: string, quantity: number) => setLines((current) => updateDocumentLine(current, variantId, { quantity })),
    setUnitCost: (variantId: string, unitCost: number | undefined) => setLines((current) => updateDocumentLine(current, variantId, { unitCost })),
    removeLine: (variantId: string) => setLines((current) => removeDocumentLine(current, variantId)),
    submit: () => mutation.mutate(),
  };
}
