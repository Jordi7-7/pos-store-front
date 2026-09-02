import React, { useMemo } from 'react';
import { X, Loader2, Info, FileText, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '../../../auth/hooks/useAuthStore';
import type {
  CashSessionHeader,
  SessionSale,
  SessionExpense,
  SessionRefund,
} from '@/modules/cash-sessions/types/cash-sessions.types';

interface CierreModalProps {
  isOpen: boolean;
  onClose: () => void;
  closingBalance: string;
  setClosingBalance: (val: string) => void;
  onCloseSession: () => void;
  isClosing: boolean;
  activeSession: CashSessionHeader | null;
  activeSessionSales: SessionSale[];
  activeSessionExpenses: SessionExpense[];
  activeSessionRefunds: SessionRefund[];
}

interface ProductSummaryItem {
  name: string;
  quantity: number;
  total: number;
}

export const CierreModal: React.FC<CierreModalProps> = ({
  isOpen,
  onClose,
  closingBalance,
  setClosingBalance,
  onCloseSession,
  isClosing,
  activeSession,
  activeSessionSales,
  activeSessionExpenses,
  activeSessionRefunds,
}) => {
  const openingBalance = activeSession?.openingBalance ? Number(activeSession.openingBalance) : 0;
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';

  const salesTotal = useMemo(() => {
    return activeSessionSales.reduce((sum, s) => sum + Number(s.total), 0);
  }, [activeSessionSales]);

  const expensesTotal = useMemo(() => {
    return activeSessionExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [activeSessionExpenses]);

  const refundsTotal = useMemo(() => {
    return activeSessionRefunds.reduce((sum, r) => sum + Number(r.totalRefunded), 0);
  }, [activeSessionRefunds]);

  const { cashSalesTotal, cardSalesTotal } = useMemo(() => {
    let cash = 0;
    let card = 0;

    activeSessionSales.forEach((sale) => {
      const saleTotal = Number(sale.total);
      const payments = sale.payments || [];

      if (!payments.length) {
        if (sale.paymentMethod === 'TARJETA') {
          card += saleTotal;
        } else {
          cash += saleTotal;
        }
        return;
      }

      payments.forEach((p) => {
        const amt = Number(p.amount);
        const cleanAmt = Math.min(amt, saleTotal);

        if (p.paymentMethod === 'TARJETA') {
          card += cleanAmt;
        } else if (p.paymentMethod === 'EFECTIVO') {
          cash += cleanAmt;
        }
      });
    });

    return { cashSalesTotal: cash, cardSalesTotal: card };
  }, [activeSessionSales]);

  const expectedCashInDrawer = openingBalance + cashSalesTotal - expensesTotal - refundsTotal;
  const difference = closingBalance !== '' ? Number(closingBalance) - expectedCashInDrawer : null;

  // Group products sold for this session with strict types
  const productsSummary = useMemo(() => {
    const summary: Record<string, ProductSummaryItem> = {};

    activeSessionSales.forEach((sale) => {
      sale.items.forEach((item) => {
        const sku = item.variant.sku;
        const productName = item.variant.product.name;
        const variantAttrs = (item.variant.attributeValues || [])
          .map((av) => av.value)
          .filter(Boolean)
          .join(' · ');
        const fullName = variantAttrs ? `${productName} (${variantAttrs})` : productName;

        if (!summary[sku]) {
          summary[sku] = {
            name: fullName,
            quantity: 0,
            total: 0,
          };
        }
        summary[sku].quantity += Number(item.quantity);
        const itemDiscount = Number(item.discountAmount || 0);
        summary[sku].total += (Number(item.price) - itemDiscount) * Number(item.quantity);
      });
    });

    return Object.entries(summary).map(([sku, data]) => ({
      sku,
      ...data,
    }));
  }, [activeSessionSales]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-card border border-border text-card-foreground rounded-2xl shadow-xl p-6 max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b border-border pb-3 shrink-0">
          <DialogTitle className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
            <X className="w-4 h-4 text-rose-500" />
            <span>Cierre de Caja Registradora</span>
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-3 min-h-0">
          
          {/* Resumen del Turno y Arqueo de Efectivo (Estilo Historial) */}
          <div className="bg-bg-dark/50 border border-border-card p-3 rounded-2xl space-y-2.5">
            
            {/* 1. VENTAS DEL TURNO (¿Cuánto se vendió?) */}
            <div className="bg-bg-card/70 border border-border-card/60 p-2.5 rounded-xl space-y-2">
              <div className="flex justify-between items-center pb-1.5 border-b border-border-card/50">
                <span className="text-[10px] text-neutral uppercase font-bold tracking-wider">Ventas del Turno</span>
                <div className="text-right">
                  <span className="text-[9px] text-neutral mr-1.5">Venta Neta:</span>
                  <span className="text-xs font-mono font-extrabold text-primary">${(salesTotal - refundsTotal).toFixed(2)}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <div className="bg-bg-dark/40 p-1.5 rounded-lg">
                  <span className="text-[8.5px] text-emerald-500 uppercase font-bold block">Efectivo</span>
                  <span className="font-mono font-bold text-emerald-500 text-xs">${cashSalesTotal.toFixed(2)}</span>
                </div>
                <div className="bg-bg-dark/40 p-1.5 rounded-lg">
                  <span className="text-[8.5px] text-blue-500 uppercase font-bold block">Tarjeta / TPV</span>
                  <span className="font-mono font-bold text-blue-500 text-xs">${cardSalesTotal.toFixed(2)}</span>
                </div>
                <div className="bg-bg-dark/40 p-1.5 rounded-lg">
                  <span className="text-[8.5px] text-neutral uppercase font-bold block">Total Facturado</span>
                  <span className="font-mono font-bold text-secondary text-xs">${salesTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* 2. ARQUEO DE EFECTIVO EN CAJA (Fórmula paso a paso) */}
            <div className="bg-bg-card/70 border border-border-card/60 p-2.5 rounded-xl space-y-2">
              <span className="text-[10px] text-neutral uppercase font-bold tracking-wider block">Fórmula de Efectivo en Gaveta</span>
              
              <div className="grid grid-cols-4 gap-1 text-center text-xs">
                <div className="bg-bg-dark/40 p-1.5 rounded-lg">
                  <span className="text-[8px] text-neutral uppercase font-bold block">Apertura</span>
                  <span className="font-mono font-semibold text-secondary text-[10.5px]">${openingBalance.toFixed(2)}</span>
                </div>
                <div className="bg-bg-dark/40 p-1.5 rounded-lg">
                  <span className="text-[8px] text-emerald-500 uppercase font-bold block">(+) Venta Efec</span>
                  <span className="font-mono font-semibold text-emerald-500 text-[10.5px]">+${cashSalesTotal.toFixed(2)}</span>
                </div>
                <div className="bg-bg-dark/40 p-1.5 rounded-lg">
                  <span className="text-[8px] text-amber-500 uppercase font-bold block">(-) Gastos</span>
                  <span className="font-mono font-semibold text-amber-500 text-[10.5px]">-${expensesTotal.toFixed(2)}</span>
                </div>
                <div className="bg-bg-dark/40 p-1.5 rounded-lg">
                  <span className="text-[8px] text-rose-500 uppercase font-bold block">(-) Devol</span>
                  <span className="font-mono font-semibold text-rose-500 text-[10.5px]">-${refundsTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-border-card/60 pt-1.5 flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">(=) Efectivo Físico Esperado</span>
                <span className="font-mono text-emerald-400 font-extrabold text-sm">${expectedCashInDrawer.toFixed(2)}</span>
              </div>
            </div>

          </div>

          {/* Breakdown Section */}
          <div className="space-y-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-primary" /> Desglose de Movimientos
            </span>

            {/* List of Sales */}
            <div className="border border-border rounded-xl p-3 bg-muted/10 space-y-3">
              <div>
                <span className="text-[9.5px] font-bold text-secondary uppercase tracking-wider block mb-1">
                  Ventas Realizadas ({activeSessionSales.length})
                </span>
                {activeSessionSales.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground italic block">Sin ventas en este turno</span>
                ) : (
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {activeSessionSales.map((sale) => {
                      const timeStr = new Date(sale.createdAt).toLocaleTimeString(undefined, {
                        timeZone: timezone,
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      });
                      const methods = (sale.payments || []).map((p) => p.paymentMethod).join('/') || sale.paymentMethod;
                      return (
                        <div key={sale.id} className="flex justify-between items-center text-[10.5px] border-b border-border/40 pb-1 last:border-b-0 last:pb-0">
                          <span className="text-muted-foreground font-mono">[{timeStr}] {sale.invoiceNumber} ({methods})</span>
                          <span className="font-mono font-semibold text-foreground">${Number(sale.total).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Detailed Products List */}
              <div className="border-t border-border/60 pt-2">
                <span className="text-[9.5px] font-bold text-secondary uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Package className="w-3 h-3 text-primary" /> Detalle de Artículos Vendidos
                </span>
                {productsSummary.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground italic block">Sin artículos vendidos en este turno</span>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {productsSummary.map((prod) => (
                      <div key={prod.sku} className="text-[10.5px] border-b border-border/40 pb-1.5 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-center font-semibold text-foreground">
                          <span className="font-mono font-bold text-[10px] text-primary">{prod.sku}</span>
                          <span className="truncate max-w-[180px] uppercase text-[10px]">{prod.name}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground pl-3 text-[9.5px]">
                          <span>Cant: x{prod.quantity}</span>
                          <span className="text-foreground font-bold font-mono">${prod.total.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* List of Expenses */}
              <div className="border-t border-border/60 pt-2">
                <span className="text-[9.5px] font-bold text-secondary uppercase tracking-wider block mb-1">
                  Gastos de Caja ({activeSessionExpenses.length})
                </span>
                {activeSessionExpenses.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground italic block">Sin gastos en este turno</span>
                ) : (
                  <div className="space-y-1.5 max-h-20 overflow-y-auto pr-1">
                    {activeSessionExpenses.map((exp) => {
                      const timeStr = new Date(exp.createdAt).toLocaleTimeString(undefined, {
                        timeZone: timezone,
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      });
                      return (
                        <div key={exp.id} className="flex justify-between items-center text-[10.5px] border-b border-border/40 pb-1 last:border-b-0 last:pb-0">
                          <span className="text-muted-foreground font-mono">[{timeStr}] {exp.description}</span>
                          <span className="font-mono font-semibold text-rose-500">${Number(exp.amount).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* List of Returns/Refunds */}
              <div className="border-t border-border/60 pt-2">
                <span className="text-[9.5px] font-bold text-secondary uppercase tracking-wider block mb-1">
                  Devoluciones de Caja ({activeSessionRefunds.length})
                </span>
                {activeSessionRefunds.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground italic block">Sin devoluciones en este turno</span>
                ) : (
                  <div className="space-y-1.5 max-h-20 overflow-y-auto pr-1">
                    {activeSessionRefunds.map((refund) => {
                      const timeStr = new Date(refund.createdAt).toLocaleTimeString(undefined, {
                        timeZone: timezone,
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      });
                      return (
                        <div key={refund.id} className="flex justify-between items-center text-[10.5px] border-b border-border/40 pb-1 last:border-b-0 last:pb-0">
                          <span className="text-muted-foreground font-mono">[{timeStr}] {refund.reason}</span>
                          <span className="font-mono font-semibold text-amber-500">${Number(refund.totalRefunded).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form input */}
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-bold">
                Monto de Cierre Físico ($)
              </label>
              <input 
                type="number" 
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                placeholder="Ingresa el efectivo contado..."
                className="w-full bg-muted/40 border border-border rounded-xl py-2.5 px-3.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {closingBalance !== '' && difference !== null && (
              <div
                className={`p-2.5 rounded-xl border flex justify-between items-center text-xs font-bold transition-all ${
                  Math.abs(difference) < 0.01
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : difference < 0
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider">
                  {Math.abs(difference) < 0.01
                    ? '✓ Caja Cuadrada Exacta'
                    : difference < 0
                    ? '⚠ Faltante en Caja'
                    : '▲ Sobrante en Caja'}
                </span>
                <span className="font-mono text-xs">
                  {difference > 0 ? `+$${difference.toFixed(2)}` : `$${difference.toFixed(2)}`}
                </span>
              </div>
            )}

            <p className="text-[9px] text-muted-foreground flex items-center gap-1 leading-normal">
              <Info className="w-3.5 h-3.5 text-primary shrink-0" />
              Cuenta el efectivo real de tu caja e ingresa el total. El sistema calculará automáticamente cualquier descuadre.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-border pt-3 shrink-0">
          <button 
            onClick={onCloseSession}
            disabled={isClosing}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isClosing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Cerrar Caja y Sesión</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CierreModal;
