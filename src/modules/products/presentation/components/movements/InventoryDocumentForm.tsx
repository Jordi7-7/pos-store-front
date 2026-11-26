import React, { useState } from 'react';
import { ScanButton } from '@/shared/presentation/components/ScanButton';
import type { ScanFeedback } from '@/shared/presentation/components/BarcodeScannerDialog';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { InventoryDocumentKind, InventoryMovementReasonLabels } from '../../../domain/enums';
import { DOCUMENT_REASONS, isCommentRequired, type LinesKind } from '../../../domain/rules/inventory-document-lines';
import { useInventoryDocumentForm } from '../../hooks';
import { DocumentLinesTable } from './DocumentLinesTable';

interface InventoryDocumentFormProps {
  kind: LinesKind;
  /** Sucursal elegida en la barra superior; sin ella no se puede registrar. En un traslado es el origen. */
  branchId: string;
  /** Sucursales a las que se puede trasladar (solo en traslados). */
  destinationOptions?: readonly { id: string; name: string }[];
  onCreated: () => void;
}

const COPY: Record<LinesKind, { done: string; confirm: string; hint: string }> = {
  [InventoryDocumentKind.ENTRY]: { done: 'Entrada registrada', confirm: 'Confirmar entrada', hint: 'Mercancía que entra sin una compra: donaciones, producción u otras entradas. Para compras a proveedores usa Compras.' },
  [InventoryDocumentKind.EXIT]: { done: 'Salida registrada', confirm: 'Confirmar salida', hint: 'Mercancía que sale sin una venta: mermas, caducidad, pérdidas o uso interno. Si una línea no alcanza, no se registra nada.' },
  [InventoryDocumentKind.TRANSFER]: { done: 'Traslado registrado', confirm: 'Confirmar traslado', hint: 'Mueve mercancía de la sucursal elegida arriba a otra. Sale y entra a la vez, y el costo viaja con la mercancía. Si una línea no alcanza en el origen, no se mueve nada.' },
};

const SELECT = 'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50';

/** Entrada o salida manual de varios productos: se agregan por SKU (o escáner), se elige el motivo y se confirma con un resumen. */
export const InventoryDocumentForm: React.FC<InventoryDocumentFormProps> = ({ kind, branchId, destinationOptions = [], onCreated }) => {
  const [sku, setSku] = useState('');
  const copy = COPY[kind];
  const form = useInventoryDocumentForm(kind, branchId, (document) => {
    toast.success(`${copy.done}: ${document.number}`);
    onCreated();
  });
  const disabled = !branchId;
  /** El traslado no lleva motivo: lo pone el sistema. */
  const hasReason = kind !== InventoryDocumentKind.TRANSFER;
  const commentRequired = isCommentRequired(kind, form.reason);

  const add = async () => {
    if (await form.addBySku(sku)) setSku('');
  };

  return (
    <div className="space-y-4">
      {disabled && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{kind === InventoryDocumentKind.TRANSFER ? 'Selecciona en la barra superior la sucursal de origen del traslado.' : 'Selecciona una sucursal en la barra superior para registrar el movimiento.'}</span>
        </div>
      )}

      <Card className="border border-border/80 shadow-xs">
        <CardContent className="space-y-5 p-6">
          <p className="text-sm text-muted-foreground">{copy.hint}</p>

          {kind === InventoryDocumentKind.TRANSFER && (
            <label className="block space-y-1.5 text-xs font-semibold text-muted-foreground">
              Sucursal de destino
              <select value={form.destinationBranchId} onChange={(event) => form.setDestinationBranchId(event.target.value)} disabled={disabled} className={SELECT}>
                <option value="">Elige la sucursal que recibe…</option>
                {destinationOptions
                  .filter((option) => option.id !== branchId)
                  .map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
              </select>
            </label>
          )}

          <div className={`grid grid-cols-1 gap-4 ${hasReason ? 'md:grid-cols-2' : ''}`}>
            {hasReason && (
              <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
                Motivo
                <select value={form.reason ?? ''} onChange={(event) => form.setReason(event.target.value || undefined)} disabled={disabled} className={SELECT}>
                  <option value="">Elige un motivo…</option>
                  {DOCUMENT_REASONS[kind].map((reason) => (
                    <option key={reason} value={reason}>
                      {InventoryMovementReasonLabels[reason]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
              {commentRequired ? 'Comentario (obligatorio)' : 'Comentario (opcional)'}
              <Textarea
                value={form.comment}
                onChange={(event) => form.setComment(event.target.value)}
                maxLength={500}
                rows={1}
                placeholder={commentRequired ? 'Explica qué pasó: aparecerá en el historial' : 'Detalle para el historial'}
                aria-required={commentRequired}
                disabled={disabled}
              />
            </label>
          </div>

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void add();
            }}
          >
            <Input value={sku} onChange={(event) => setSku(event.target.value)} placeholder="Escribe o escanea el SKU y pulsa Enter…" aria-label="SKU del producto" disabled={disabled} className="font-mono" />
            <ScanButton continuous title="Escanear productos" onDetected={async (code): Promise<ScanFeedback> => ((await form.addBySku(code)) ? { status: 'ok', message: `${code} agregado` } : { status: 'error', message: `El código ${code} no existe` })} />
            <Button type="submit" variant="outline" disabled={disabled || form.isSearching || !sku.trim()}>
              {form.isSearching ? <Loader2 className="animate-spin" /> : <Plus />}
              Agregar
            </Button>
          </form>

          {form.lines.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-10 text-center text-xs italic text-muted-foreground">Aún no hay productos. Agrega el primero con su SKU.</div>
          ) : (
            <DocumentLinesTable kind={kind} lines={form.lines} shortages={form.shortages} onQuantityChange={form.setQuantity} onUnitCostChange={form.setUnitCost} onRemove={form.removeLine} />
          )}

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {form.summary.products} producto(s) · {form.summary.units} unidad(es)
              {form.shortages.length > 0 && <span className="ml-2 font-semibold text-destructive">{form.shortages.length} línea(s) sin stock suficiente</span>}
              {form.blocker && form.lines.length > 0 && <span className="ml-2">· {form.blocker}</span>}
            </p>
            <Button type="button" onClick={form.submit} disabled={disabled || form.isSaving || form.blocker !== null || form.shortages.length > 0}>
              {form.isSaving && <Loader2 className="animate-spin" />}
              {copy.confirm}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
