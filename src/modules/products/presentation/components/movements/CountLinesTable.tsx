import React from 'react';
import { Trash2 } from 'lucide-react';
import { countDifference, type CountFormLine } from '../../../domain/rules/stock-count-lines';

interface CountLinesTableProps {
  lines: readonly CountFormLine[];
  onCountedChange: (variantId: string, counted: number | undefined) => void;
  onUnitCostChange: (variantId: string, unitCost: number | undefined) => void;
  onRemove: (variantId: string) => void;
}

const INPUT = 'h-8 w-full rounded-lg border border-border bg-card px-2.5 py-1 text-right text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary';

const differenceText = (difference: number | null): { text: string; className: string } => {
  if (difference === null) return { text: '—', className: 'text-muted-foreground' };
  if (difference === 0) return { text: '0', className: 'text-muted-foreground' };
  return difference > 0 ? { text: `+${difference}`, className: 'text-emerald-600' } : { text: String(difference), className: 'text-destructive' };
};

/** Líneas del conteo: lo que decía el sistema, lo contado y la diferencia; el costo solo aparece si sobra mercancía. */
export const CountLinesTable: React.FC<CountLinesTableProps> = ({ lines, onCountedChange, onUnitCostChange, onRemove }) => (
  <div className="overflow-x-auto rounded-xl border border-border">
    <table className="w-full border-collapse text-left text-xs">
      <thead>
        <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground">
          <th className="px-4 py-3">Producto</th>
          <th className="px-4 py-3 text-right">Sistema</th>
          <th className="w-28 px-4 py-3 text-right">Contado</th>
          <th className="px-4 py-3 text-right">Diferencia</th>
          <th className="w-32 px-4 py-3 text-right">Costo de lo que sobra</th>
          <th className="w-12 px-4 py-3" aria-label="Quitar" />
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {lines.map((line) => {
          const difference = countDifference(line);
          const shown = differenceText(difference);
          return (
            <tr key={line.variantId} className="hover:bg-muted/20">
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">{line.productName}</div>
                <div className="font-mono text-muted-foreground">{line.sku}</div>
              </td>
              <td className="px-4 py-3 text-right font-mono text-muted-foreground">{line.expected}</td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  aria-label={`Contado de ${line.sku}`}
                  value={line.counted === undefined || Number.isNaN(line.counted) ? '' : line.counted}
                  onChange={(event) => onCountedChange(line.variantId, event.target.value === '' ? undefined : Number(event.target.value))}
                  className={INPUT}
                />
              </td>
              <td className={`px-4 py-3 text-right font-mono font-bold ${shown.className}`}>{shown.text}</td>
              <td className="px-4 py-3">
                {difference !== null && difference > 0 ? (
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
                ) : (
                  <span className="block text-right text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                <button type="button" onClick={() => onRemove(line.variantId)} className="rounded p-1 text-muted-foreground transition-colors hover:text-rose-500" title="Quitar producto">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
