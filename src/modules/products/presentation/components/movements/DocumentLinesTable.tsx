import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { InventoryDocumentKind } from '../../../domain/enums';
import type { DocumentFormLine, LinesKind } from '../../../domain/rules/inventory-document-lines';

interface DocumentLinesTableProps {
  kind: LinesKind;
  lines: readonly DocumentFormLine[];
  shortages: readonly DocumentFormLine[];
  onQuantityChange: (variantId: string, quantity: number) => void;
  onUnitCostChange: (variantId: string, unitCost: number | undefined) => void;
  onRemove: (variantId: string) => void;
}

const INPUT = 'h-8 w-full rounded-lg border border-border bg-card px-2.5 py-1 text-right text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary';

/** Líneas del movimiento: producto, existencia, cantidad y (solo en entradas) costo; marca las líneas que no alcanzan. */
export const DocumentLinesTable: React.FC<DocumentLinesTableProps> = ({ kind, lines, shortages, onQuantityChange, onUnitCostChange, onRemove }) => {
  const isEntry = kind === InventoryDocumentKind.ENTRY;
  const short = new Set(shortages.map((line) => line.variantId));

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground">
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3 text-right">En sucursal</th>
            <th className="w-28 px-4 py-3 text-right">Cantidad</th>
            {isEntry && <th className="w-32 px-4 py-3 text-right">Costo unitario</th>}
            <th className="w-12 px-4 py-3" aria-label="Quitar" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {lines.map((line) => (
            <tr key={line.variantId} className={short.has(line.variantId) ? 'bg-destructive/5' : 'hover:bg-muted/20'}>
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">{line.productName}</div>
                <div className="font-mono text-muted-foreground">{line.sku}</div>
              </td>
              <td className="px-4 py-3 text-right font-mono text-muted-foreground">{line.stock}</td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  inputMode="decimal"
                  aria-label={`Cantidad de ${line.sku}`}
                  value={Number.isNaN(line.quantity) ? '' : line.quantity}
                  onChange={(event) => onQuantityChange(line.variantId, event.target.value === '' ? NaN : Number(event.target.value))}
                  className={INPUT}
                />
                {short.has(line.variantId) && (
                  <p className="mt-1 flex items-center justify-end gap-1 text-[11px] font-medium text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    Solo hay {line.stock}
                  </p>
                )}
              </td>
              {isEntry && (
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    aria-label={`Costo de ${line.sku}`}
                    placeholder={String(line.referenceCost)}
                    value={line.unitCost ?? ''}
                    onChange={(event) => onUnitCostChange(line.variantId, event.target.value === '' ? undefined : Number(event.target.value))}
                    className={INPUT}
                  />
                </td>
              )}
              <td className="px-4 py-3 text-center">
                <button type="button" onClick={() => onRemove(line.variantId)} className="rounded p-1 text-muted-foreground transition-colors hover:text-rose-500" title="Quitar producto">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
