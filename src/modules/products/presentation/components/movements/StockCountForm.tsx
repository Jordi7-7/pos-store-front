import React, { useState } from 'react';
import { ScanButton } from '@/shared/presentation/components/ScanButton';
import type { ScanFeedback } from '@/shared/presentation/components/BarcodeScannerDialog';
import { AlertCircle, AlertTriangle, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCategories, useStockCountForm } from '../../hooks';
import { CountLinesTable } from './CountLinesTable';

interface StockCountFormProps {
  /** Sucursal elegida en la barra superior; sin ella no se puede registrar. */
  branchId: string;
  onCreated: () => void;
}

const SELECT = 'h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50';

/** Conteo físico: agrega productos, escribe lo contado y el sistema calcula la diferencia. Si el stock cambió mientras se contaba, pide confirmar. */
export const StockCountForm: React.FC<StockCountFormProps> = ({ branchId, onCreated }) => {
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [onlyWithStock, setOnlyWithStock] = useState(true);
  const { categories } = useCategories();
  const form = useStockCountForm(branchId, (document) => {
    toast.success(`Conteo registrado: ${document.number}`);
    onCreated();
  });
  const disabled = !branchId;

  const add = async () => {
    if (await form.addBySku(sku)) setSku('');
  };

  return (
    <div className="space-y-4">
      {disabled && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-500">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>Selecciona una sucursal en la barra superior para registrar el conteo.</span>
        </div>
      )}

      <Card className="border border-border/80 shadow-xs">
        <CardContent className="space-y-5 p-6">
          <p className="text-sm text-muted-foreground">
            Agrega los productos que contaste y escribe cuántos hay. El sistema calcula la diferencia y la aplica sobre el stock actual, así lo que se venda mientras cuentas no se pierde.
          </p>

          <label className="block space-y-1.5 text-xs font-semibold text-muted-foreground">
            Comentario (opcional)
            <Textarea value={form.comment} onChange={(event) => form.setComment(event.target.value)} maxLength={500} rows={1} placeholder="Detalle para el historial" disabled={disabled} />
          </label>

          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-3 sm:flex-row sm:items-end">
            <label className="flex-1 space-y-1.5 text-xs font-semibold text-muted-foreground">
              Cargar productos de la sucursal
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={disabled || form.isLoadingSheet} className={SELECT} aria-label="Categoría a cargar">
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 pb-2 text-xs font-medium text-foreground">
              <input type="checkbox" checked={onlyWithStock} onChange={(event) => setOnlyWithStock(event.target.checked)} disabled={disabled || form.isLoadingSheet} />
              Solo con existencias
            </label>
            <Button type="button" variant="outline" onClick={() => void form.loadFromBranch({ categoryId: categoryId || undefined, onlyWithStock })} disabled={disabled || form.isLoadingSheet}>
              {form.isLoadingSheet && <Loader2 className="animate-spin" />}
              Cargar productos
            </Button>
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
            <CountLinesTable lines={form.lines} onCountedChange={form.setCounted} onUnitCostChange={form.setUnitCost} onRemove={form.removeLine} />
          )}

          {form.changes.length > 0 && (
            <div role="alert" className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs">
              <p className="flex items-center gap-2 font-semibold text-amber-600">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                El stock cambió mientras contabas
              </p>
              <ul className="space-y-0.5 text-foreground">
                {form.changes.map((change) => (
                  <li key={change.variantId}>
                    <span className="font-mono">{change.sku}</span>: veías {change.expected} y ahora hay {change.current}.
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground">Si confirmas, la diferencia que contaste se aplica sobre el stock de ahora (no se pisan las ventas hechas en medio).</p>
              <Button type="button" size="sm" onClick={form.confirmChanges} disabled={form.isSaving}>
                {form.isSaving && <Loader2 className="animate-spin" />}
                Aplicar de todos modos
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {form.summary.counted} de {form.lines.length} contado(s) · sobran {form.summary.surplus} · faltan {form.summary.shortage}
              {form.summary.pending > 0 && <span className="ml-2">· {form.summary.pending} sin contar (no se tocan)</span>}
              {form.blocker && form.lines.length > 0 && <span className="ml-2">· {form.blocker}</span>}
            </p>
            {form.summary.pending > 0 && form.summary.counted > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={form.removeUncounted}>
                Quitar los sin contar
              </Button>
            )}
            <Button type="button" onClick={form.submit} disabled={disabled || form.isSaving || form.blocker !== null || form.changes.length > 0}>
              {form.isSaving && <Loader2 className="animate-spin" />}
              Confirmar conteo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
