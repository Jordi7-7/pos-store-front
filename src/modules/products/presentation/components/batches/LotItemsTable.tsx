import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { InventoryLotVM } from '../../view-models/inventory.vm';
import { LevelFill } from './BatchBadges';

/** Productos que llegaron en un lote: cantidades inicial, consumida y disponible, y su costo. */
export const LotItemsTable: React.FC<{ items: InventoryLotVM['items'] }> = ({ items }) => (
  <div className="overflow-x-auto">
  <Table>
    <TableHeader>
      <TableRow className="uppercase tracking-wider text-[10px] font-bold border-b border-border-card">
        <TableHead className="pr-2">Producto / SKU</TableHead>
        <TableHead className="px-2 text-right">Cant. Inicial</TableHead>
        <TableHead className="px-2 text-right">Consumido</TableHead>
        <TableHead className="px-2 text-right">Disponible</TableHead>
        <TableHead className="px-2 text-right">Costo Unit.</TableHead>
        <TableHead className="pl-2 text-right">Valor Restante</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map((item) => (
        <TableRow
          key={item.id}
          className={`text-secondary hover:bg-muted/10 transition-colors ${
            !item.isAvailable ? 'opacity-55' : ''
          }`}
        >
          {/* Product Name & SKU */}
          <TableCell className="py-2.5 pr-2">
            <div className="font-semibold text-secondary text-xs">{item.productName}</div>
            <div className="font-mono text-[10px] text-primary">{item.sku || '-'}</div>
          </TableCell>

          {/* Initial Qty */}
          <TableCell className="py-2.5 px-2 text-right font-mono font-medium text-xs">
            {item.initialQuantity}
          </TableCell>

          {/* Consumed Qty */}
          <TableCell className="py-2.5 px-2 text-right font-mono text-neutral text-xs">
            {item.consumedQuantity}
          </TableCell>

          {/* Remaining Qty with Bar */}
          <TableCell className="py-2.5 px-2 text-right">
            <span className={`font-mono font-bold text-xs ${item.isAvailable ? 'text-emerald-500' : 'text-neutral'}`}>
              {item.remainingQuantity}
            </span>
            {item.initialQuantity > 0 && (
              <div className="w-16 ml-auto mt-1 h-1 rounded-full bg-muted/60 overflow-hidden">
                <LevelFill percent={item.percentRemaining} />
              </div>
            )}
          </TableCell>

          {/* Unit Cost */}
          <TableCell className="py-2.5 px-2 text-right font-mono text-neutral font-medium text-xs">
            {item.unitCostFormatted}
          </TableCell>

          {/* Total Value */}
          <TableCell className="py-2.5 pl-2 text-right font-mono font-bold text-xs text-primary">
            {item.totalCostFormatted}
            <span className="text-[10px] font-normal text-neutral/80 block">
              Ini: {item.initialCostFormatted}
            </span>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
);
