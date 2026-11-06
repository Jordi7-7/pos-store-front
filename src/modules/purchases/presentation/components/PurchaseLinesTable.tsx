import React from 'react';
import { Plus } from 'lucide-react';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFormatters } from '@/modules/auth/presentation/hooks/useFormatters';
import type { PurchaseLine } from '../../domain/rules/purchase-lines';
import { PurchaseFormRow } from './PurchaseFormRow';

interface PurchaseLinesTableProps {
  lines: PurchaseLine[];
  total: number;
  onUpdateRow: (index: number, fields: Partial<PurchaseLine>) => void;
  onRemoveRow: (index: number) => void;
  onProductSelect: (index: number, sku: string | null) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>, row: number, col: 'sku' | 'quantity' | 'unitCost') => void;
  onAddRow: () => void;
}

const HEAD = 'text-xs font-bold text-muted-foreground';

/** Tabla de filas del ingreso (SKU, cantidad, costo) con el total y el botón de añadir fila. */
export const PurchaseLinesTable: React.FC<PurchaseLinesTableProps> = ({ lines, total, onUpdateRow, onRemoveRow, onProductSelect, onKeyDown, onAddRow }) => {
  const fmt = useFormatters();
  return (
    <>
      <div className="border border-border rounded-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className={`${HEAD} w-1/4`}>SKU / Código</TableHead>
              <TableHead className={`${HEAD} w-1/3`}>Nombre del Producto</TableHead>
              <TableHead className={`${HEAD} text-right w-24`}>Cant.</TableHead>
              <TableHead className={`${HEAD} text-right w-28`}>Costo U.</TableHead>
              <TableHead className={`${HEAD} text-right w-28`}>Subtotal</TableHead>
              <TableHead className={`${HEAD} text-center w-12`}>Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line, index) => (
              <PurchaseFormRow key={index} index={index} item={line} onUpdateRow={onUpdateRow} onRemoveRow={onRemoveRow} onProductSelect={onProductSelect} onKeyDown={onKeyDown} />
            ))}
          </TableBody>
          <TableFooter className="bg-muted/20 border-t border-border">
            <TableRow>
              <TableCell colSpan={4} className="text-right text-xs font-bold text-muted-foreground">Total de Ingreso:</TableCell>
              <TableCell className="text-right text-sm font-extrabold text-primary font-mono">{fmt.money(total)}</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="flex justify-start">
        <button
          type="button"
          onClick={onAddRow}
          className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-border hover:border-primary/50 text-xs font-semibold rounded-lg text-muted-foreground hover:text-primary transition-all bg-card/50"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agregar Fila</span>
        </button>
      </div>
    </>
  );
};
