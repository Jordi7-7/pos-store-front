import React from 'react';
import {
  Barcode,
  Minus,
  Plus,
  Trash2,
  Percent,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { SaleItemRow, NewExchangeItem } from './exchange-return.types';
import { getNetUnitPrice, formatMoney } from './exchange-return.types';

interface ExchangeItemsStepProps {
  selectedReturnItems: SaleItemRow[];
  returnQtyMap: Record<string, number>;
  totalToReturn: number;
  newItems: NewExchangeItem[];
  scanInput: string;
  onChangeScanInput: (val: string) => void;
  onScanKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isScanLoading: boolean;
  scanRef: React.RefObject<HTMLInputElement | null>;
  onAdjustNewItemQty: (variantId: string, delta: number) => void;
  onRemoveNewItem: (variantId: string) => void;
  onUpdateNewItemDiscount: (variantId: string, type: 'PERCENTAGE' | 'AMOUNT', inputVal: number) => void;
  totalNewItems: number;
  exchangeDiff: number;
  reason: string;
  onChangeReason: (val: string) => void;
  onConfirmExchange: () => void;
  isProcessing: boolean;
}

export const ExchangeItemsStep: React.FC<ExchangeItemsStepProps> = ({
  selectedReturnItems,
  returnQtyMap,
  totalToReturn,
  newItems,
  scanInput,
  onChangeScanInput,
  onScanKeyDown,
  isScanLoading,
  scanRef,
  onAdjustNewItemQty,
  onRemoveNewItem,
  onUpdateNewItemDiscount,
  totalNewItems,
  exchangeDiff,
  reason,
  onChangeReason,
  onConfirmExchange,
  isProcessing,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Returned items (negative) */}
      <div>
        <p className="text-[10px] text-rose-400 uppercase tracking-wider font-semibold mb-1.5">Prendas que devuelve</p>
        <div className="flex flex-col gap-1.5">
          {selectedReturnItems.map((item: SaleItemRow) => (
            <div key={item.variantId} className="flex items-center justify-between rounded-lg bg-rose-500/8 border border-rose-500/20 px-3.5 py-2.5">
              <div className="min-w-0 pr-3">
                <p className="text-sm font-semibold text-foreground">{item.productName}</p>
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {item.sku && (
                    <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400">
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
      </div>

      {/* New items scanner */}
      <div>
        <p className="text-[10px] text-indigo-400 uppercase tracking-wider font-semibold mb-1.5">Prendas que lleva</p>
        <div className="relative flex gap-2 mb-2">
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            ref={scanRef}
            autoFocus
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-muted border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-400"
            placeholder="Escanear código de barras…"
            value={scanInput}
            onChange={(e) => onChangeScanInput(e.target.value)}
            onKeyDown={onScanKeyDown}
          />
          {isScanLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
        </div>

        {newItems.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {newItems.map((item) => {
              const discountType = item.discountType || 'PERCENTAGE';
              const discountRate = item.discountRate || 0;
              const unitDiscount = item.discountAmount || 0;
              const lineTotal = Math.max(0, (item.price - unitDiscount) * item.quantity);

              return (
                <div key={item.variantId} className="flex items-center gap-3 rounded-lg bg-indigo-500/8 border border-indigo-500/20 px-3.5 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.productName}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {item.sku && (
                        <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                          SKU: {item.sku}
                        </span>
                      )}
                      {item.attributes && <span className="text-[11px] text-muted-foreground">{item.attributes}</span>}
                      <span className="text-[11px] font-mono text-muted-foreground">· ${item.price.toFixed(2)} c/u</span>
                      {unitDiscount > 0 && (
                        <span className="text-[10px] font-mono text-emerald-400 font-medium">
                          (-${(unitDiscount * item.quantity).toFixed(2)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Discount pill */}
                  <div
                    className="flex items-center bg-background/80 border border-border rounded-lg h-7 px-1 shadow-xs shrink-0"
                    title={discountType === 'PERCENTAGE' ? 'Descuento (%)' : 'Precio Especial ($)'}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const nextType = discountType === 'PERCENTAGE' ? 'AMOUNT' : 'PERCENTAGE';
                        const nextVal = nextType === 'AMOUNT' ? item.price : 0;
                        onUpdateNewItemDiscount(item.variantId, nextType, nextVal);
                      }}
                      className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                      title={discountType === 'PERCENTAGE' ? 'Cambiar a Precio Fijo ($)' : 'Cambiar a Porcentaje (%)'}
                    >
                      {discountType === 'PERCENTAGE' ? (
                        <Percent className="w-2.5 h-2.5 text-blue-400 font-bold" />
                      ) : (
                        <DollarSign className="w-2.5 h-2.5 text-emerald-400 font-bold" />
                      )}
                    </button>
                    <input
                      type="number"
                      placeholder="0"
                      min="0"
                      step={discountType === 'PERCENTAGE' ? '1' : '0.01'}
                      value={discountRate === 0 ? '' : discountRate}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        onUpdateNewItemDiscount(item.variantId, discountType, val);
                      }}
                      className="w-10 h-6 text-[10.5px] font-mono text-right bg-transparent text-foreground focus:outline-none pr-0.5"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onAdjustNewItemQty(item.variantId, -1)}
                      className="w-6 h-6 rounded bg-background border border-border flex items-center justify-center hover:bg-muted cursor-pointer"
                    >
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold tabular-nums text-indigo-400">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onAdjustNewItemQty(item.variantId, +1)}
                      className="w-6 h-6 rounded bg-background border border-border flex items-center justify-center hover:bg-muted cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-indigo-400 shrink-0 w-16 text-right">+{formatMoney(lineTotal)}</p>
                  <button
                    type="button"
                    onClick={() => onRemoveNewItem(item.variantId)}
                    className="text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {newItems.length === 0 && (
          <div className="rounded-lg border border-dashed border-border py-6 flex flex-col items-center gap-1.5 text-muted-foreground">
            <Barcode className="w-5 h-5 opacity-40" />
            <p className="text-xs">Escanea los nuevos artículos</p>
          </div>
        )}
      </div>

      {/* Difference summary */}
      {newItems.length > 0 && (
        <div className={`rounded-xl px-4 py-3 border ${
          exchangeDiff > 0
            ? 'bg-emerald-500/10 border-emerald-500/25'
            : exchangeDiff < 0
            ? 'bg-rose-500/10 border-rose-500/25'
            : 'bg-muted/50 border-border'
        }`}>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Devuelto</span>
            <span className="text-rose-500 font-medium">-{formatMoney(totalToReturn)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Nuevos artículos</span>
            <span className="text-indigo-400 font-medium">+{formatMoney(totalNewItems)}</span>
          </div>
          <div className="flex justify-between items-center border-t border-border pt-2">
            <p className="text-sm font-semibold text-foreground">
              {exchangeDiff > 0 ? 'Cliente paga' : exchangeDiff < 0 ? 'Devolver al cliente' : 'Sin diferencia'}
            </p>
            <p className={`text-lg font-bold ${
              exchangeDiff > 0 ? 'text-emerald-500' : exchangeDiff < 0 ? 'text-rose-500' : 'text-foreground'
            }`}>
              {exchangeDiff === 0 ? '$0.00' : formatMoney(Math.abs(exchangeDiff))}
            </p>
          </div>
        </div>
      )}

      {newItems.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Escanea al menos una prenda nueva para completar el cambio.
        </div>
      )}

      {/* Reason input for exchange */}
      {newItems.length > 0 && (
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1.5">
            Razón del cambio
          </label>
          <textarea
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none"
            placeholder="Ej: Cambio de talla, cambio de color…"
            value={reason}
            onChange={(e) => onChangeReason(e.target.value)}
          />
        </div>
      )}

      <button
        type="button"
        onClick={onConfirmExchange}
        disabled={isProcessing || newItems.length === 0}
        className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
      >
        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        Confirmar Cambio
      </button>
    </div>
  );
};
