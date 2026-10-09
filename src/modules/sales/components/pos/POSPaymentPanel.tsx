import React from 'react';
import {
  Banknote,
  CreditCard,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react';
import { PaymentMethod } from '../../services/sales.service';
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty, ComboboxTrigger } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select';
import type { Customer } from '../../hooks/useCustomers';
import type { CartItem } from '../../types/pos.types';

interface AddedPayment {
  paymentMethod: PaymentMethod;
  amount: number;
}

interface POSPaymentPanelProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (id: string) => void;
  cart: CartItem[];
  grossSubtotal: number;
  totalItemDiscounts: number;
  netSubtotal: number;
  globalDiscountRate: number;
  onSetGlobalDiscountRate: (rate: number) => void;
  globalDiscountAmount: number;
  cartTotal: number;
  addedPayments: AddedPayment[];
  amountPaid: number;
  remaining: number;
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  customAmountText: string;
  onChangeCustomAmountText: (text: string) => void;
  onAddPayment: () => void;
  onRemovePayment: (index: number) => void;
  onCompletePayment: () => void;
  isProcessing: boolean;
  activeSession: any;
  paymentAmountInputRef: React.RefObject<HTMLInputElement | null>;
}

export const POSPaymentPanel: React.FC<POSPaymentPanelProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  cart,
  grossSubtotal,
  totalItemDiscounts,
  netSubtotal,
  globalDiscountRate,
  onSetGlobalDiscountRate,
  globalDiscountAmount,
  cartTotal,
  addedPayments,
  amountPaid,
  remaining,
  selectedMethod,
  onSelectMethod,
  customAmountText,
  onChangeCustomAmountText,
  onAddPayment,
  onRemovePayment,
  onCompletePayment,
  isProcessing,
  activeSession,
  paymentAmountInputRef,
}) => {
  const getMethodDetails = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.EFECTIVO:
        return {
          label: 'Efectivo',
          sub: 'Cash',
          icon: Banknote,
          colorClass: 'text-emerald-500 bg-emerald-500/10',
        };
      case PaymentMethod.TARJETA:
        return {
          label: 'Tarjeta',
          sub: 'Card',
          icon: CreditCard,
          colorClass: 'text-blue-500 bg-blue-500/10',
        };
      default:
        return {
          label: method,
          sub: 'Payment',
          icon: Banknote,
          colorClass: 'text-neutral bg-neutral/10',
        };
    }
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="lg:col-span-2 min-h-0 flex flex-col overflow-hidden bg-bg-card border border-border-card rounded-2xl p-4 shadow-sm">
      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto -mr-2 pr-2">
        <h3 className="text-[11px] font-bold text-secondary uppercase tracking-wider border-b border-border-card pb-2">
          Detalles de Pago y Cierre
        </h3>

        {/* Customer & Global Discount */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_88px] gap-2 items-end">
          {/* Customer Selector */}
          <div className="space-y-1 min-w-0">
            <span className="text-[9px] font-bold text-neutral uppercase tracking-wider block">
              Cliente Facturación
            </span>
            <Combobox
              items={customers}
              value={customers.find((c: Customer) => c.id === selectedCustomerId) || null}
              onValueChange={(val: any) => onSelectCustomer(val?.id || '')}
            >
              <ComboboxTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal bg-bg-dark border-border-card text-xs text-secondary rounded-lg py-1 px-2.5 h-8 hover:bg-bg-dark/80 hover:text-secondary flex items-center"
                  >
                    {(() => {
                      const activeCust = customers.find(
                        (c: Customer) => c.id === selectedCustomerId,
                      );
                      return activeCust ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-[11px] text-secondary truncate">
                            {activeCust.name}
                          </span>
                          <span className="text-[9px] text-neutral-400 font-mono shrink-0">
                            ({activeCust.identityNumber})
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral text-[10.5px]">Seleccionar cliente...</span>
                      );
                    })()}
                  </Button>
                }
              />
              <ComboboxContent className="bg-bg-card border border-border-card rounded-xl shadow-2xl z-30 w-72 max-h-60 overflow-y-auto">
                <ComboboxInput
                  showTrigger={false}
                  placeholder="Buscar por nombre o cédula..."
                  className="w-full border-b border-border-card bg-transparent px-3 py-2 text-xs text-secondary focus:outline-none placeholder-neutral"
                />
                <ComboboxEmpty className="p-3 text-center text-xs text-neutral">
                  No se encontraron clientes
                </ComboboxEmpty>
                <ComboboxList>
                  {(c: any) => (
                    <ComboboxItem
                      key={c.id}
                      value={c}
                      className="px-3 py-1.5 hover:bg-bg-dark text-xs text-secondary rounded-lg transition-colors cursor-pointer flex flex-col items-start gap-0.5"
                    >
                      <span className="font-bold text-[11px] text-secondary">{c.name}</span>
                      <span className="text-[9.5px] text-neutral font-mono">
                        {c.identityNumber}
                      </span>
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          {/* Global Discount Block */}
          <div className="space-y-1 min-w-0">
            <div className="flex justify-between items-center text-[9px] font-bold text-neutral uppercase tracking-wider">
              <span>Desc. (%)</span>
              {globalDiscountAmount > 0 && (
                <span className="text-emerald-400 font-mono font-bold">
                  -${globalDiscountAmount.toFixed(2)}
                </span>
              )}
            </div>
            <Input
              type="number"
              placeholder="0"
              min="0"
              max="100"
              step="1"
              value={globalDiscountRate === 0 ? '' : globalDiscountRate}
              onChange={(e) => {
                const val = Math.max(0, parseFloat(e.target.value) || 0);
                onSetGlobalDiscountRate(val);
              }}
              className="w-full h-8 rounded-lg py-1 px-2 text-xs text-secondary text-right font-mono bg-bg-dark border-border-card focus-visible:border-primary"
            />
          </div>
        </div>

        {/* Calculation Rows */}
        <div className="space-y-1 text-[11px] text-neutral border-t border-border-card/50 pt-2">
          <div className="flex justify-between items-center">
            <span>Cantidad de Artículos</span>
            <span className="font-bold text-secondary font-mono">{totalItemsCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Subtotal Bruto</span>
            <span className="font-bold text-secondary font-mono">
              ${grossSubtotal.toFixed(2)}
            </span>
          </div>
          {totalItemDiscounts > 0 && (
            <div className="flex justify-between items-center text-emerald-400 font-medium">
              <span>Descuento por Ítem</span>
              <span className="font-bold font-mono">-${totalItemDiscounts.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span>Subtotal Neto</span>
            <span className="font-bold text-secondary font-mono">${netSubtotal.toFixed(2)}</span>
          </div>
          {globalDiscountAmount > 0 && (
            <div className="flex justify-between items-center text-emerald-400 font-medium">
              <span>Descuento Global Venta</span>
              <span className="font-bold font-mono">-${globalDiscountAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Highlighted Hero Total */}
        <div className="bg-brand-secondary border border-brand-secondary-border rounded-2xl p-3 flex justify-between items-center shadow-xs">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-secondary-foreground block leading-tight">
              Monto Total a Cobrar
            </span>
            <span className="text-[9.5px] text-zinc-600 font-medium">
              {totalItemsCount} artículo(s)
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-brand-secondary-foreground font-mono tracking-tight leading-none">
            ${cartTotal.toFixed(2)}
          </span>
        </div>

        {/* Payment Section */}
        {cart.length > 0 && (
          <div className="border-t border-border-card/50 pt-2.5 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[9.5px] font-bold text-neutral uppercase tracking-wider">
                Cargar Pagos
              </span>
              <div className="text-right flex items-center gap-1.5">
                <span className="text-[9px] uppercase font-bold text-neutral">Por Pagar:</span>
                <span
                  className={`text-base font-black font-mono ${remaining <= 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                >
                  ${remaining <= 0 ? '0.00' : remaining.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Selector and Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddPayment();
              }}
              className="bg-bg-dark/40 border border-border-card/60 rounded-xl p-1.5 flex gap-1.5 items-center"
            >
              <div className="w-[125px] shrink-0">
                <Select
                  value={selectedMethod}
                  onValueChange={(val: any) =>
                    onSelectMethod(val || PaymentMethod.EFECTIVO)
                  }
                >
                  <SelectTrigger className="w-full justify-between font-normal bg-bg-dark border-border-card text-xs text-secondary rounded-lg py-1 px-2 h-8 hover:bg-bg-dark/80 hover:text-secondary flex items-center border">
                    {(() => {
                      const details = getMethodDetails(selectedMethod);
                      const Icon = details.icon;
                      return (
                        <div className="flex items-center gap-1.5 truncate">
                          <div className={`p-0.5 rounded ${details.colorClass} shrink-0`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <span className="font-bold text-[10.5px] text-secondary truncate">
                            {details.label}
                          </span>
                        </div>
                      );
                    })()}
                  </SelectTrigger>
                  <SelectContent className="bg-bg-card border border-border-card rounded-xl shadow-2xl z-30 w-[140px] max-h-60 overflow-y-auto p-1">
                    {Object.values(PaymentMethod).map((method) => {
                      const details = getMethodDetails(method);
                      const Icon = details.icon;
                      return (
                        <SelectItem
                          key={method}
                          value={method}
                          className="px-2 py-1 hover:bg-bg-dark text-xs text-secondary rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <div className={`p-0.5 rounded ${details.colorClass} shrink-0`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <span className="font-bold text-[10.5px] text-secondary">
                            {details.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <input
                ref={paymentAmountInputRef}
                type="number"
                placeholder="0.00"
                min="0"
                value={customAmountText}
                onChange={(e) => onChangeCustomAmountText(e.target.value)}
                className="flex-1 min-w-0 h-8 bg-bg-dark border border-border-card rounded-lg py-1 px-2.5 text-xs text-secondary font-mono font-bold focus:outline-none focus:border-primary placeholder-neutral"
              />
              <button
                type="submit"
                className="h-8 px-3.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
              >
                Agregar
              </button>
            </form>

            {/* Added Payments List */}
            {addedPayments.length > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-bold text-neutral uppercase tracking-wider">
                  <span>Pagos Registrados ({addedPayments.length})</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    Total: ${amountPaid.toFixed(2)}
                  </span>
                </div>
                <div className="max-h-20 space-y-1 overflow-y-auto pr-1">
                  {addedPayments.map((p, idx) => {
                    const details = getMethodDetails(p.paymentMethod);
                    const Icon = details.icon;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1 px-2 bg-bg-dark/40 border border-border-card/50 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-1.5">
                          <div className={`p-0.5 rounded ${details.colorClass}`}>
                            <Icon className="w-3 h-3" />
                          </div>
                          <span className="font-semibold text-[10.5px] text-secondary">
                            {details.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-secondary font-mono text-[11px]">
                            ${p.amount.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemovePayment(idx)}
                            className="p-0.5 text-neutral hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cash change helper */}
            {amountPaid > cartTotal && (
              <div className="p-2.5 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-xl flex justify-between items-center animate-fade-in shadow-xs">
                <div>
                  <span className="text-[9.5px] uppercase font-black tracking-wider block">
                    Vuelto / Cambio a entregar
                  </span>
                  <span className="text-[8.5px] opacity-80 block">Entregar al cliente</span>
                </div>
                <span className="text-2xl font-mono font-black tracking-tight text-emerald-400">
                  ${(amountPaid - cartTotal).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Submit Button */}
      <div className="shrink-0 border-t border-border-card/50 bg-bg-card pt-2.5">
        <button
          type="button"
          onClick={onCompletePayment}
          disabled={!activeSession || cart.length === 0 || isProcessing || amountPaid < cartTotal}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:bg-neutral/20 disabled:text-neutral/60 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isProcessing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          <span>Completar Venta</span>
        </button>
      </div>
    </div>
  );
};
