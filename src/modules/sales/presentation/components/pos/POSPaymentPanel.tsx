import type { ActiveCashSessionEntity } from '@/modules/cash-sessions/domain/entities/cash-session.entity';
import React from 'react';
import {
  Banknote,
  CreditCard,
  Trash2,
  Check,
  Loader2,
} from 'lucide-react';
import { PaymentMethod } from '../../../domain/enums';
import { Combobox, ComboboxInput, ComboboxContent, ComboboxList, ComboboxItem, ComboboxEmpty, ComboboxTrigger } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CustomerVM } from '@/modules/customers';
import type { CartItem } from '../../../domain/entities/cart-item';
import { formatMoney } from '@/modules/auth/presentation/hooks/useSession';

interface AddedPayment {
  paymentMethod: PaymentMethod;
  amount: number;
}

interface POSPaymentPanelProps {
  customers: CustomerVM[];
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
  onAddExactPayment: () => void;
  onRemovePayment: (index: number) => void;
  onCompletePayment: () => void;
  isProcessing: boolean;
  activeSession: ActiveCashSessionEntity | null;
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
  onAddExactPayment,
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
 <h3 className="text-xs font-bold text-secondary border-b border-border-card pb-2">
          Detalles de Pago y Cierre
        </h3>

        {/* Customer & Global Discount */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_88px] gap-2 items-end">
          {/* Customer Selector */}
          <div className="space-y-1 min-w-0">
 <span className="text-xs font-bold text-neutral block">
              Cliente Facturación
            </span>
            <Combobox
              items={customers}
              value={customers.find((c: CustomerVM) => c.id === selectedCustomerId) || null}
              onValueChange={(val: CustomerVM | null) => onSelectCustomer(val?.id || '')}
            >
              <ComboboxTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal bg-bg-dark border-border-card text-xs text-secondary rounded-lg py-1 px-2.5 h-8 hover:bg-bg-dark/80 hover:text-secondary flex items-center"
                  >
                    {(() => {
                      const activeCust = customers.find(
                        (c: CustomerVM) => c.id === selectedCustomerId,
                      );
                      return activeCust ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-bold text-xs text-secondary truncate">
                            {activeCust.name}
                          </span>
                          <span className="text-xs text-neutral-400 font-mono shrink-0">
                            ({activeCust.identityNumber})
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral text-xs">Seleccionar cliente...</span>
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
                  {(c: CustomerVM) => (
                    <ComboboxItem
                      key={c.id}
                      value={c}
                      className="px-3 py-1.5 hover:bg-bg-dark text-xs text-secondary rounded-lg transition-colors cursor-pointer flex flex-col items-start gap-0.5"
                    >
                      <span className="font-bold text-xs text-secondary">{c.name}</span>
                      <span className="text-xs text-neutral font-mono">
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
 <div className="flex justify-between items-center text-xs font-bold text-neutral ">
              <span>Desc. (%)</span>
              {globalDiscountAmount > 0 && (
                <span className="text-emerald-400 font-mono font-bold">
                  -{formatMoney(globalDiscountAmount)}
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
        <div className="space-y-1 text-[13px] text-neutral border-t border-border-card/50 pt-2.5">
          <div className="flex justify-between items-center">
            <span>Cantidad de Artículos</span>
            <span className="font-bold text-secondary font-mono">{totalItemsCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Subtotal Bruto</span>
            <span className="font-bold text-secondary font-mono">
              {formatMoney(grossSubtotal)}
            </span>
          </div>
          {totalItemDiscounts > 0 && (
            <div className="flex justify-between items-center text-emerald-400 font-medium">
              <span>Descuento por Ítem</span>
              <span className="font-bold font-mono">-{formatMoney(totalItemDiscounts)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span>Subtotal Neto</span>
            <span className="font-bold text-secondary font-mono">{formatMoney(netSubtotal)}</span>
          </div>
          {globalDiscountAmount > 0 && (
            <div className="flex justify-between items-center text-emerald-400 font-medium">
              <span>Descuento Global Venta</span>
              <span className="font-bold font-mono">-{formatMoney(globalDiscountAmount)}</span>
            </div>
          )}
        </div>

        {/* Highlighted Hero Total */}
        <div className="bg-brand-secondary border border-brand-secondary-border rounded-2xl p-3 flex justify-between items-center shadow-xs">
          <div>
 <span className="text-xs font-black text-brand-secondary-foreground block leading-tight">
              Monto Total a Cobrar
            </span>
            <span className="text-xs text-zinc-600 font-medium">
              {totalItemsCount} artículo(s)
            </span>
          </div>
          <span className="text-2xl sm:text-3xl font-bold text-brand-secondary-foreground font-mono tracking-tight leading-none">
            {formatMoney(cartTotal)}
          </span>
        </div>

        {/* Payment Section */}
        {cart.length > 0 && (
          <div className="border-t border-border-card/50 pt-2.5 space-y-2.5">
            <div className="flex justify-between items-center">
 <span className="text-xs font-bold text-neutral ">
                Cargar Pagos
              </span>
              <div className="text-right flex items-center gap-1.5">
 <span className="text-xs font-bold text-neutral">Por Pagar:</span>
                <span
                  className={`text-lg font-bold font-mono ${remaining <= 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                >
                  {formatMoney(Math.max(0, remaining))}
                </span>
              </div>
            </div>

            {/* Método de pago: un clic, sin desplegable */}
            <div role="radiogroup" aria-label="Método de pago" className="grid grid-cols-2 gap-2">
              {Object.values(PaymentMethod).map((method) => {
                const details = getMethodDetails(method);
                const Icon = details.icon;
                const active = selectedMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onSelectMethod(method)}
                    className={`h-10 rounded-lg border-2 text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                      active
                        ? 'border-primary bg-primary/10 text-secondary shadow-xs'
                        : 'border-border-card bg-bg-dark/40 text-neutral hover:text-secondary hover:border-primary/40'
                    }`}
                  >
                    <span className={`p-1 rounded ${details.colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    {details.label}
                  </button>
                );
              })}
            </div>

            {/* Monto recibido y Agregar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddPayment();
              }}
              className="flex gap-2 items-stretch"
            >
              <div className="relative flex-1 min-w-0">
                <input
                  ref={paymentAmountInputRef}
                  type="number"
                  placeholder="0.00"
                  min="0"
                  aria-label="Monto recibido"
                  value={customAmountText}
                  onChange={(e) => onChangeCustomAmountText(e.target.value)}
                  className="w-full h-10 bg-bg-dark border-2 border-border-card rounded-lg pl-3 pr-12 text-base text-secondary font-mono font-semibold focus:outline-none focus:border-primary placeholder-neutral"
                />
                <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border-card bg-bg-card px-1.5 py-0.5 text-xs font-mono font-semibold text-neutral">
                  F7
                </kbd>
              </div>
              <button
                type="submit"
                className="h-10 px-4 bg-primary hover:bg-primary-hover text-white rounded-lg text-[13px] font-semibold shadow-xs transition-all cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                Agregar
              </button>
            </form>

            {/* Cobro exacto: el cliente paga justo lo que falta */}
            {remaining > 0 && (
              <button
                type="button"
                onClick={onAddExactPayment}
                className="w-full h-10 rounded-lg border-2 border-dashed border-primary/50 text-primary hover:bg-primary/10 text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                Cobro exacto {formatMoney(remaining)}
                <kbd className="rounded border border-primary/40 bg-bg-card px-1.5 py-0.5 text-xs font-mono font-semibold">F8</kbd>
              </button>
            )}

            {/* Added Payments List */}
            {addedPayments.length > 0 && (
              <div className="space-y-1">
 <div className="flex justify-between items-center text-xs font-bold text-neutral ">
                  <span>Pagos Registrados ({addedPayments.length})</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    Total: {formatMoney(amountPaid)}
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
                          <span className="font-semibold text-xs text-secondary">
                            {details.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-secondary font-mono text-xs">
                            {formatMoney(p.amount)}
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
 <span className="text-xs font-black block">
                    Vuelto / Cambio a entregar
                  </span>
                  <span className="text-xs opacity-80 block">Entregar al cliente</span>
                </div>
                <span className="text-2xl font-mono font-black tracking-tight text-emerald-400">
                  {formatMoney(amountPaid - cartTotal)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Submit Button */}
      <div className="shrink-0 border-t border-border-card/50 bg-bg-card pt-3">
        <button
          type="button"
          onClick={onCompletePayment}
          disabled={!activeSession || cart.length === 0 || isProcessing || amountPaid < cartTotal}
          className="w-full h-12 bg-primary hover:bg-primary-hover disabled:bg-neutral/20 disabled:text-neutral/60 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
          <span>Completar Venta</span>
          <kbd className="rounded border border-white/40 bg-white/10 px-1.5 py-0.5 text-xs font-mono font-semibold">F12</kbd>
        </button>
      </div>
    </div>
  );
};
