import React, { useState, useMemo } from 'react';
import { Receipt, Printer, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/modules/auth';

interface HistorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSessionSales: any[];
  activeSessionExpenses: any[];
  activeSessionRefunds: any[];
  activeSession: any | null;
  branchId: string;
  onPrintSale?: (sale: any) => void;
}

type HistoryTab = 'sales' | 'expenses' | 'refunds';

// Status badge helper
function SaleStatusBadge({ status }: { status?: string }) {
  if (!status || status === 'COMPLETED') return null;
  if (status === 'REFUNDED') {
    return (
      <Badge variant="destructive" className="text-[8px] h-4 px-1.5 leading-none font-extrabold">
        DEVUELTA
      </Badge>
    );
  }
  if (status === 'PARTIALLY_REFUNDED') {
    return (
      <Badge className="text-[8px] h-4 px-1.5 leading-none font-extrabold bg-amber-500/15 text-amber-500 border-amber-500/30 border">
        PARCIAL
      </Badge>
    );
  }
  return null;
}

export const HistorialModal: React.FC<HistorialModalProps> = ({
  isOpen,
  onClose,
  activeSessionSales,
  activeSessionExpenses,
  activeSessionRefunds,
  activeSession,
  onPrintSale,
}) => {
  const [historyTab, setHistoryTab] = useState<HistoryTab>('sales');
  const [searchTerm, setSearchTerm] = useState('');
  const timezone = useAuthStore((state: any) => state.timezone) || 'America/Guayaquil';

  const filteredSales = activeSessionSales.filter((sale) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const invNo = (sale.invoiceNumber || '').toLowerCase();
    const client = (sale.customer?.name || 'Consumidor Final').toLowerCase();
    return invNo.includes(term) || client.includes(term);
  });

  const openingBalance = Number(activeSession?.openingBalance || 0);

  const totalSalesSum = useMemo(
    () => activeSessionSales.reduce((sum, sale) => sum + Number(sale.total || sale.totalAmount || 0), 0),
    [activeSessionSales]
  );
  const totalExpensesSum = useMemo(
    () => activeSessionExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0),
    [activeSessionExpenses]
  );
  const totalRefundsSum = useMemo(
    () => activeSessionRefunds.reduce((sum, ref) => sum + Number(ref.totalRefunded || ref.total || 0), 0),
    [activeSessionRefunds]
  );

  const { cashSalesSum, cardSalesSum } = useMemo(() => {
    let cash = 0;
    let card = 0;

    activeSessionSales.forEach((sale) => {
      const saleTotal = Number(sale.total || sale.totalAmount || 0);
      const payments = sale.payments || [];

      if (!payments.length) {
        const method = (sale.paymentMethod || 'EFECTIVO').toUpperCase();
        if (method === 'TARJETA') {
          card += saleTotal;
        } else {
          cash += saleTotal;
        }
        return;
      }

      payments.forEach((p: any) => {
        const method = (p.paymentMethod || '').toUpperCase();
        const amt = Number(p.amount || 0);
        // Protection against legacy oversized test entries
        const cleanAmt = Math.min(amt, saleTotal);

        if (method === 'TARJETA') {
          card += cleanAmt;
        } else if (method === 'EFECTIVO') {
          cash += cleanAmt;
        }
      });
    });

    return { cashSalesSum: cash, cardSalesSum: card };
  }, [activeSessionSales]);

  const handleClose = () => onClose();

  const TAB_STYLES = (active: boolean, color: string) =>
    `px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
      active
        ? `${color} border`
        : 'bg-bg-dark text-neutral hover:text-secondary border border-border-card'
    }`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2 mb-2">
            <Receipt className="w-4 h-4 text-primary" />
            <span>Historial de la Sesión Activa</span>
          </DialogTitle>

          {/* Resumen del Turno Activo */}
          <div className="bg-bg-dark/50 border border-border-card p-3 rounded-2xl mb-3 space-y-2.5">
            
            {/* 1. VENTAS DEL TURNO (¿Cuánto se vendió?) */}
            <div className="bg-bg-card/70 border border-border-card/60 p-2.5 rounded-xl space-y-2">
              <div className="flex justify-between items-center pb-1.5 border-b border-border-card/50">
                <span className="text-[10px] text-neutral uppercase font-bold tracking-wider">Ventas del Turno</span>
                <div className="text-right">
                  <span className="text-[9px] text-neutral mr-1.5">Venta Neta:</span>
                  <span className="text-xs font-mono font-extrabold text-primary">${(totalSalesSum - totalRefundsSum).toFixed(2)}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <div className="bg-bg-dark/40 p-1.5 rounded-lg">
                  <span className="text-[8.5px] text-emerald-500 uppercase font-bold block">Efectivo</span>
                  <span className="font-mono font-bold text-emerald-500 text-xs">${cashSalesSum.toFixed(2)}</span>
                </div>
                <div className="bg-bg-dark/40 p-1.5 rounded-lg">
                  <span className="text-[8.5px] text-blue-500 uppercase font-bold block">Tarjeta / TPV</span>
                  <span className="font-mono font-bold text-blue-500 text-xs">${cardSalesSum.toFixed(2)}</span>
                </div>
                <div className="bg-bg-dark/40 p-1.5 rounded-lg">
                  <span className="text-[8.5px] text-neutral uppercase font-bold block">Total Facturado</span>
                  <span className="font-mono font-bold text-secondary text-xs">${totalSalesSum.toFixed(2)}</span>
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
                  <span className="font-mono font-semibold text-emerald-500 text-[10.5px]">+${cashSalesSum.toFixed(2)}</span>
                </div>
                <div className="bg-bg-dark/40 p-1.5 rounded-lg">
                  <span className="text-[8px] text-amber-500 uppercase font-bold block">(-) Gastos</span>
                  <span className="font-mono font-semibold text-amber-500 text-[10.5px]">-${totalExpensesSum.toFixed(2)}</span>
                </div>
                <div className="bg-bg-dark/40 p-1.5 rounded-lg">
                  <span className="text-[8px] text-rose-500 uppercase font-bold block">(-) Devol</span>
                  <span className="font-mono font-semibold text-rose-500 text-[10.5px]">-${totalRefundsSum.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-border-card/60 pt-1.5 flex justify-between items-center px-1">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">(=) Efectivo Físico Esperado</span>
                <span className="font-mono text-emerald-400 font-extrabold text-sm">${(openingBalance + cashSalesSum - totalExpensesSum - totalRefundsSum).toFixed(2)}</span>
              </div>
            </div>

          </div>

          <div className="flex gap-2 pb-2 flex-wrap">
            <button
              onClick={() => setHistoryTab('sales')}
              className={TAB_STYLES(historyTab === 'sales', 'bg-primary/20 text-primary border-primary/30')}
            >
              Ventas ({activeSessionSales.length})
            </button>
            <button
              onClick={() => setHistoryTab('expenses')}
              className={TAB_STYLES(historyTab === 'expenses', 'bg-amber-500/20 text-amber-500 border-amber-500/30')}
            >
              Gastos ({activeSessionExpenses.length})
            </button>
            <button
              onClick={() => setHistoryTab('refunds')}
              className={TAB_STYLES(historyTab === 'refunds', 'bg-rose-500/20 text-rose-500 border-rose-500/30')}
            >
              Devoluciones ({activeSessionRefunds.length})
            </button>
          </div>
        </DialogHeader>

        {/* Search Invoice Input */}
        {historyTab === 'sales' && (
          <div className="px-1 mb-1 mt-2 animate-fade-in">
            <input
              type="text"
              placeholder="Buscar factura por folio o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-[11px] bg-bg-dark border border-border-card text-secondary placeholder-neutral rounded-xl px-3 py-1.5 outline-none focus:border-primary/50 transition-all font-mono"
            />
          </div>
        )}

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1 pt-2">
          {/* ── SALES TAB ── */}
          {historyTab === 'sales' && (
            filteredSales.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral">
                {activeSessionSales.length === 0 ? 'No has registrado ninguna venta en esta sesión todavía.' : 'No se encontraron facturas con esa búsqueda.'}
              </div>
            ) : (
              filteredSales.map((sale: any) => (
                <div key={sale.id} className="flex justify-between items-center bg-bg-dark/40 border border-border-card p-3 rounded-xl text-secondary animate-fade-in gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold font-mono">
                        {sale.invoiceNumber}
                      </span>
                      <SaleStatusBadge status={sale.status} />
                    </div>
                    <div className="text-[9px] text-neutral mt-0.5">{new Date(sale.createdAt).toLocaleTimeString(undefined, { timeZone: timezone })}</div>
                    <div className="text-[9px] text-neutral">{(sale.items || []).length} artículo(s)</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-primary">${Number(sale.total || sale.totalAmount || 0).toFixed(2)}</div>
                    <span className="text-[8.5px] uppercase tracking-wider font-bold text-neutral-400 bg-bg-card px-2 py-0.5 rounded border border-border-card inline-block mt-0.5">
                      {sale.payments?.[0]?.paymentMethod || 'Efectivo'}
                    </span>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => onPrintSale?.(sale)}
                      title="Reimprimir ticket"
                      className="flex items-center justify-center p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )
          )}

          {/* ── EXPENSES TAB ── */}
          {historyTab === 'expenses' && (
            activeSessionExpenses.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral">No has registrado ningún gasto en esta sesión todavía.</div>
            ) : (
              activeSessionExpenses.map((exp: any) => (
                <div key={exp.id} className="flex justify-between items-center bg-bg-dark/40 border border-border-card p-3 rounded-xl text-secondary animate-fade-in">
                  <div>
                    <div className="text-[11px] font-bold text-secondary">{exp.desc}</div>
                    <div className="text-[9px] text-neutral mt-0.5">{exp.createdAt ? new Date(exp.createdAt).toLocaleTimeString(undefined, { timeZone: timezone }) : 'Hace un momento'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-amber-500">-${Number(exp.amount || 0).toFixed(2)}</div>
                    <span className="text-[8.5px] uppercase tracking-wider font-bold text-amber-400 bg-bg-card px-2 py-0.5 rounded border border-border-card inline-block mt-0.5">
                      {exp.category || 'Servicios'}
                    </span>
                  </div>
                </div>
              ))
            )
          )}

          {/* ── REFUNDS TAB ── */}
          {historyTab === 'refunds' && (
            activeSessionRefunds.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral">No se han procesado devoluciones en esta sesión.</div>
            ) : (
              activeSessionRefunds.map((refund: any) => (
                <div key={refund.id} className="bg-bg-dark/40 border border-rose-500/20 p-3 rounded-xl animate-fade-in space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <RotateCcw className="w-3 h-3 text-rose-500 shrink-0" />
                      <span className="text-[10px] font-bold text-rose-400">
                        Venta del {new Date(refund.createdAt).toLocaleDateString(undefined, { timeZone: timezone })} • {new Date(refund.createdAt).toLocaleTimeString(undefined, { timeZone: timezone })}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-rose-500 font-mono">
                      -${Number(refund.totalRefunded || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {(refund.items || []).map((item: any) => (
                      <div key={item.id} className="flex justify-between text-[9px] text-neutral">
                        <span className="truncate">{item.variant?.product?.name || item.variantId.slice(0, 8)}</span>
                        <span className="font-mono shrink-0 ml-2">
                          x{Number(item.quantity)} × ${Number(item.priceRefunded).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] text-neutral italic truncate max-w-[60%]">"{refund.reason}"</span>
                    <span className="text-[9px] text-neutral shrink-0">
                      {new Date(refund.createdAt).toLocaleTimeString(undefined, { timeZone: timezone })}
                    </span>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Summary Footer Bar */}
        <div className="mt-4 pt-3 border-t border-border-card flex justify-between items-center text-xs font-bold bg-bg-dark/20 p-3 rounded-xl">
          {historyTab === 'sales' && (
            <>
              <span className="text-neutral">Total Ventas:</span>
              <span className="text-primary text-sm">${totalSalesSum.toFixed(2)}</span>
            </>
          )}
          {historyTab === 'expenses' && (
            <>
              <span className="text-neutral">Total Gastos:</span>
              <span className="text-amber-500 text-sm">-${totalExpensesSum.toFixed(2)}</span>
            </>
          )}
          {historyTab === 'refunds' && (
            <>
              <span className="text-neutral">Total Devuelto:</span>
              <span className="text-rose-500 text-sm">-${totalRefundsSum.toFixed(2)}</span>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
