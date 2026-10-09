import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import type { SaleItemRow } from './exchange-return.types';
import { getNetUnitPrice, formatMoney } from './exchange-return.types';

interface ExchangeConfirmRefundStepProps {
  foundSale: any;
  selectedReturnItems: SaleItemRow[];
  returnQtyMap: Record<string, number>;
  totalToReturn: number;
  reason: string;
  onChangeReason: (val: string) => void;
  onConfirmRefund: () => void;
  isProcessing: boolean;
}

export const ExchangeConfirmRefundStep: React.FC<ExchangeConfirmRefundStepProps> = ({
  foundSale,
  selectedReturnItems,
  returnQtyMap,
  totalToReturn,
  reason,
  onChangeReason,
  onConfirmRefund,
  isProcessing,
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3">
        <p className="text-xs text-rose-400 uppercase tracking-wider font-semibold mb-1">Resumen de Devolución</p>
        <p className="text-xs text-muted-foreground">Folio: <span className="text-foreground font-mono">{foundSale?.invoiceNumber}</span></p>
      </div>

      <div className="flex flex-col gap-2">
        {selectedReturnItems.map((item: SaleItemRow) => (
          <div key={item.variantId} className="flex items-center justify-between rounded-lg bg-muted/40 border border-border px-4 py-2.5">
            <div className="min-w-0 pr-3">
              <p className="text-sm font-semibold text-foreground">{item.productName}</p>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                {item.sku && (
                  <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-muted/80 border border-border text-foreground">
                    SKU: {item.sku}
                  </span>
                )}
                {item.attributes && <span className="text-[11px] text-muted-foreground">{item.attributes}</span>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-muted-foreground">×{returnQtyMap[item.variantId]}</p>
              <p className="text-sm font-semibold text-rose-500">-{formatMoney(getNetUnitPrice(item) * returnQtyMap[item.variantId])}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-rose-500/15 border border-rose-500/25 px-4 py-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-rose-400">Total a devolver</p>
        <p className="text-xl font-bold text-rose-500">{formatMoney(totalToReturn)}</p>
      </div>

      {/* Reason input */}
      <div>
        <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">
          Razón de devolución
        </label>
        <textarea
          rows={2}
          className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-rose-400 resize-none"
          placeholder="Ej: Talla incorrecta, defecto de fábrica…"
          value={reason}
          onChange={(e) => onChangeReason(e.target.value)}
        />
      </div>

      <button
        type="button"
        onClick={onConfirmRefund}
        disabled={isProcessing}
        className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
      >
        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        Confirmar Devolución
      </button>
    </div>
  );
};
