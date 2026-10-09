import React from 'react';
import { Minus, Plus, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SaleItemRow } from './exchange-return.types';
import { getNetUnitPrice, formatMoney } from './exchange-return.types';

interface ExchangeSelectItemsStepProps {
  foundSale: any;
  returnQtyMap: Record<string, number>;
  onAdjustReturnQty: (variantId: string, delta: number, max: number) => void;
  selectedReturnItems: SaleItemRow[];
  totalToReturn: number;
  allItemsFullyRefunded: boolean;
  onContinue: () => void;
}

export const ExchangeSelectItemsStep: React.FC<ExchangeSelectItemsStepProps> = ({
  foundSale,
  returnQtyMap,
  onAdjustReturnQty,
  selectedReturnItems,
  totalToReturn,
  allItemsFullyRefunded,
  onContinue,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Sale header */}
      <div className="rounded-xl bg-muted/50 border border-border px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Folio</p>
          <p className="text-sm font-bold text-foreground font-mono">{foundSale.invoiceNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total original</p>
          <p className="text-sm font-bold text-foreground">{formatMoney(foundSale.total)}</p>
        </div>
        <div>
          <Badge
            className={`text-[9px] font-bold px-2 py-0.5 ${
              foundSale.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 border' :
              foundSale.status === 'REFUNDED' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 border' :
              'bg-amber-500/15 text-amber-400 border-amber-500/30 border'
            }`}
          >
            {foundSale.status === 'COMPLETED' ? 'Completada' :
             foundSale.status === 'REFUNDED' ? 'Devuelta' : 'Parcial'}
          </Badge>
        </div>
      </div>

      {/* Fully refunded banner */}
      {allItemsFullyRefunded && (
        <div className="flex items-center gap-2 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Esta venta ya fue completamente devuelta. No hay prendas disponibles para devolver.</span>
        </div>
      )}

      {/* Items list */}
      {!allItemsFullyRefunded && (
        <p className="text-xs text-muted-foreground">Selecciona la cantidad de cada prenda a devolver:</p>
      )}
      <div className="flex flex-col gap-2">
        {foundSale.items.map((item: SaleItemRow) => {
          const qty = returnQtyMap[item.variantId] ?? 0;
          const isFullyRefunded = item.refundableQty === 0;
          return (
            <div key={item.variantId} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
              isFullyRefunded ? 'bg-muted/20 border-border/50 opacity-60' : 'bg-muted/40 border-border'
            }`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-semibold ${isFullyRefunded ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {item.productName}
                  </p>
                  {item.refundedQty > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25 shrink-0">
                      {isFullyRefunded ? 'Devuelta' : `${item.refundedQty} devuelta(s)`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {item.sku && (
                    <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-muted/80 border border-border text-foreground">
                      SKU: {item.sku}
                    </span>
                  )}
                  {item.attributes && (
                    <span className="text-[11px] text-muted-foreground">{item.attributes}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  <span className="text-xs text-foreground font-semibold">
                    {formatMoney(getNetUnitPrice(item))} × {item.quantity}
                  </span>
                  {Number(item.discountAmount) > 0 && (
                    <span className="text-[10px] text-muted-foreground line-through">
                      {formatMoney(item.price)}
                    </span>
                  )}
                  {Number(item.discountAmount) > 0 && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-500 font-medium">
                      desc. -{formatMoney(Number(item.discountAmount))}
                    </span>
                  )}
                  {item.refundableQty < item.quantity && !isFullyRefunded && (
                    <span className="text-[11px] text-muted-foreground font-normal"> (disponibles: {item.refundableQty})</span>
                  )}
                </div>
              </div>
              {/* Qty stepper */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onAdjustReturnQty(item.variantId, -1, item.refundableQty)}
                  disabled={qty === 0 || isFullyRefunded}
                  className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className={`w-6 text-center text-sm font-bold tabular-nums ${qty > 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => onAdjustReturnQty(item.variantId, +1, item.refundableQty)}
                  disabled={qty >= item.refundableQty || isFullyRefunded}
                  className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary + Next */}
      {selectedReturnItems.length > 0 && (
        <div className="mt-1 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-rose-400 uppercase tracking-wider">A devolver</p>
            <p className="text-base font-bold text-rose-500">{formatMoney(totalToReturn)}</p>
          </div>
          <p className="text-xs text-muted-foreground">{selectedReturnItems.length} prenda(s)</p>
        </div>
      )}

      <button
        type="button"
        disabled={selectedReturnItems.length === 0 || allItemsFullyRefunded}
        onClick={onContinue}
        className="w-full mt-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-all active:scale-[0.98] cursor-pointer"
      >
        Continuar →
      </button>
    </div>
  );
};
