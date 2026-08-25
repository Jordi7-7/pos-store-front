import React from 'react';
import { Trash2 } from 'lucide-react';
import type { Product } from '../../products/services/products.service';
import { 
  Combobox, 
  ComboboxInput, 
  ComboboxContent, 
  ComboboxEmpty, 
  ComboboxList, 
  ComboboxItem 
} from '@/components/ui/combobox';
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
  products: Product[];
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
  products,
  onUpdateRow,
  onRemoveRow,
  onProductSelect,
  onKeyDown,
}) => {
  return (
    <TableRow className="hover:bg-muted/10 transition-colors">
      <TableCell className="p-2">
        <Combobox 
          value={item.variantSku} 
          onValueChange={(val) => onProductSelect(index, val)}
          items={products}
        >
          <ComboboxInput
            placeholder="Escriba SKU..."
            className="text-xs h-8 w-full bg-card border border-border rounded-lg px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            data-row={index}
            data-col="sku"
            onKeyDown={(e: any) => onKeyDown(e, index, 'sku')}
          />
          <ComboboxContent className="bg-popover border border-border rounded-xl shadow-2xl z-30 w-full max-h-60 overflow-y-auto">
            <ComboboxEmpty className="p-3 text-center text-xs text-neutral">
              No se encontraron productos.
            </ComboboxEmpty>
            <ComboboxList className="p-1">
              {(p: Product) => {
                const sku = p.variants?.[0]?.sku || '';
                return (
                  <ComboboxItem 
                    key={p.id} 
                    value={sku || p.name}
                    className="px-3 py-1.5 hover:bg-accent hover:text-accent-foreground text-xs text-secondary rounded-lg transition-colors cursor-pointer flex justify-between gap-2"
                  >
                    <span className="font-mono text-primary font-bold text-[10px]">{sku || 'S/SKU'}</span>
                    <span className="truncate max-w-[150px]">{p.name}</span>
                  </ComboboxItem>
                );
              }}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </TableCell>
      <TableCell className="p-2 text-xs font-semibold text-foreground/80 max-w-[200px] truncate">
        {item.productName || <span className="text-muted-foreground italic text-[10px]">Ingrese SKU o seleccione de sugerencias</span>}
      </TableCell>
      <TableCell className="p-2">
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdateRow(index, { quantity: parseInt(e.target.value) || 0 })}
          onKeyDown={(e) => onKeyDown(e, index, 'quantity')}
          data-row={index}
          data-col="quantity"
          min="1"
          className="w-full text-right bg-card border border-border rounded-lg py-1 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </TableCell>
      <TableCell className="p-2">
        <input
          type="number"
          step="0.01"
          value={item.unitCost}
          onChange={(e) => onUpdateRow(index, { unitCost: parseFloat(e.target.value) || 0 })}
          onKeyDown={(e) => onKeyDown(e, index, 'unitCost')}
          data-row={index}
          data-col="unitCost"
          min="0"
          className="w-full text-right font-mono bg-card border border-border rounded-lg py-1 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
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
