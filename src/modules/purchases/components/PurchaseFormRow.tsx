import React from 'react';
import { Trash2 } from 'lucide-react';
import { TableRow, TableCell } from '@/components/ui/table';

interface PurchaseItemInput {
  variantId: string;
  variantSku: string;
  productName: string;
  combinationText: string;
  quantity: number;
  unitCost: number;
}

interface PurchaseFormRowProps {
  index: number;
  item: PurchaseItemInput;
  onUpdateRow: (index: number, fields: Partial<PurchaseItemInput>) => void;
  onRemoveRow: (index: number) => void;
  onProductSelect: (index: number, skuVal: string | null) => void;
  onKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>, 
    rowIndex: number, 
    field: 'sku' | 'quantity' | 'unitCost'
  ) => void;
}

export const PurchaseFormRow: React.FC<PurchaseFormRowProps> = ({
  index,
  item,
  onUpdateRow,
  onRemoveRow,
  onProductSelect,
  onKeyDown,
}) => {
  const [isQtyFocused, setIsQtyFocused] = React.useState(false);

  return (
    <TableRow className="hover:bg-muted/10 transition-colors">
      <TableCell className="p-2">
        <input
          type="text"
          placeholder="Escriba SKU..."
          value={item.variantSku}
          onChange={(e) => onUpdateRow(index, { variantSku: e.target.value })}
          onBlur={() => {
            if (item.variantSku.trim()) {
              onProductSelect(index, item.variantSku.trim());
            }
          }}
          className="text-xs h-8 w-full bg-card border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          data-row={index}
          data-col="sku"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (item.variantSku.trim()) {
                onProductSelect(index, item.variantSku.trim());
              }
            } else {
              onKeyDown(e, index, 'sku');
            }
          }}
        />
      </TableCell>
      <TableCell className="p-2 text-xs font-semibold text-foreground/80 max-w-[200px] truncate">
        {item.productName || <span className="text-muted-foreground italic text-[10px]">Ingrese SKU y presione Enter</span>}
      </TableCell>
      <TableCell className="p-2">
        <input
          type="number"
          value={item.quantity === 0 && isQtyFocused ? '' : item.quantity}
          onChange={(e) => {
            const val = e.target.value;
            onUpdateRow(index, { quantity: val === '' ? 0 : parseInt(val) || 0 });
          }}
          onFocus={() => setIsQtyFocused(true)}
          onBlur={() => {
            setIsQtyFocused(false);
            if (item.quantity <= 0) {
              onUpdateRow(index, { quantity: 1 });
            }
          }}
          onKeyDown={(e) => onKeyDown(e, index, 'quantity')}
          data-row={index}
          data-col="quantity"
          min="1"
          className="w-full text-right bg-card border border-border rounded-lg py-1 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </TableCell>
      <TableCell className="p-2 text-right font-mono text-xs text-foreground/80">
        ${(item.unitCost || 0).toFixed(2)}
      </TableCell>
      <TableCell className="p-2 text-right font-bold text-foreground/80 font-mono text-xs">
        ${((item.quantity || 0) * (item.unitCost || 0)).toFixed(2)}
      </TableCell>
      <TableCell className="p-2 text-center">
        <button
          type="button"
          onClick={() => onRemoveRow(index)}
          className="text-muted-foreground hover:text-rose-500 p-1 rounded transition-colors"
          title="Eliminar fila"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </TableCell>
    </TableRow>
  );
};
