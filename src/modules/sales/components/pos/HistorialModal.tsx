import React, { useState } from 'react';
import { Receipt, RotateCcw, ArrowLeft, Minus, Plus, CheckCircle, AlertCircle, Loader2, Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useProcessRefund, useRefunds } from '../../hooks/useSales';
import { useAuthStore } from '@/modules/auth';

interface HistorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSessionSales: any[];
  activeSessionExpenses: any[];
  activeSession: any | null;
  branchId: string;
  onPrintSale?: (sale: any) => void;
}

type ModalView = 'list' | 'refund';
type HistoryTab = 'sales' | 'expenses' | 'refunds';

interface RefundQtyMap {
  [variantId: string]: number;
}

// Status badge helper
function SaleStatusBadge({ status }: { status?: string }) {
  if (!status || status === 'COMPLETED') return null;
  if (status === 'REFUNDED') {
    return (
      <Badge variant="destructive" className="text-[8px] h-4 px-1.5 leading-none font-extrabold">
        REEMBOLSADA
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
  activeSession,
  branchId,
  onPrintSale,
}) => {
  const [historyTab, setHistoryTab] = useState<HistoryTab>('sales');
  const [view, setView] = useState<ModalView>('list');
  const [selectedSale, setSelectedSale] = useState<any | null>(null);
  const [refundQtys, setRefundQtys] = useState<RefundQtyMap>({});
  const [refundReason, setRefundReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const timezone = useAuthStore((state: any) => state.timezone) || 'America/Guayaquil';

  const filteredSales = activeSessionSales.filter((sale) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const invNo = (sale.invoiceNumber || '').toLowerCase();
    const client = (sale.customer?.name || 'Consumidor Final').toLowerCase();
    return invNo.includes(term) || client.includes(term);
  });

  const { processRefund, isProcessing } = useProcessRefund();
  const { refunds, refetchRefunds } = useRefunds(
    activeSession ? { cashSessionId: activeSession.id } : undefined
  );

  const totalSalesSum = activeSessionSales.reduce((sum, sale) => sum + Number(sale.total || sale.totalAmount || 0), 0);
  const totalExpensesSum = activeSessionExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);
  const totalRefundsSum = (refunds || []).reduce((sum, ref) => sum + Number(ref.totalRefunded || 0), 0);

  const cashSalesSum = activeSessionSales.reduce((sum, sale) => {
    const isCash = (sale.payments || []).some(
      (p: { paymentMethod: string }) => p.paymentMethod.toUpperCase() === 'EFECTIVO'
    );
    return sum + (isCash ? Number(sale.total || sale.totalAmount || 0) : 0);
  }, 0);

  const currentCashBalance = Number(activeSession?.openingBalance || 0) + cashSalesSum - totalExpensesSum - totalRefundsSum;

  const openRefundView = (sale: any) => {
    setSelectedSale(sale);
    const initQtys: RefundQtyMap = {};
    (sale.items || []).forEach((item: any) => { initQtys[item.variantId] = 0; });
    setRefundQtys(initQtys);
    setRefundReason('');
    setView('refund');
  };

  const closeRefundView = () => {
    setView('list');
    setSelectedSale(null);
    setRefundQtys({});
    setRefundReason('');
  };

  const adjustQty = (variantId: string, delta: number, maxQty: number) => {
    setRefundQtys((prev) => {
      const next = (prev[variantId] || 0) + delta;
      return { ...prev, [variantId]: Math.max(0, Math.min(next, maxQty)) };
    });
  };

  const totalRefundItems = Object.values(refundQtys).reduce((s, v) => s + v, 0);

  const calcRefundTotal = () => {
    if (!selectedSale) return 0;
    return (selectedSale.items || []).reduce((sum: number, item: any) => {
      const qty = refundQtys[item.variantId] || 0;
      return sum + qty * Number(item.price || 0);
    }, 0);
  };

  const handleConfirmRefund = async () => {
    if (!selectedSale || !activeSession) return;
    if (totalRefundItems === 0) { toast.error('Selecciona al menos un artículo a devolver.'); return; }
    if (!refundReason.trim()) { toast.error('Por favor escribe el motivo de la devolución.'); return; }

    const itemsToRefund = Object.entries(refundQtys)
      .filter(([, qty]) => qty > 0)
      .map(([variantId, quantity]) => ({ variantId, quantity }));

    try {
      await processRefund({
        branchId,
        saleId: selectedSale.id,
        cashSessionId: activeSession.id,
        reason: refundReason.trim(),
        items: itemsToRefund,
      });
      toast.success(`Devolución procesada. Total reembolsado: $${calcRefundTotal().toFixed(2)}`);
      refetchRefunds();
      closeRefundView();
    } catch (err: any) {
      toast.error(err?.message || 'Error al procesar la devolución.');
    }
  };

  const handleClose = () => {
    if (view === 'refund') { closeRefundView(); return; }
    onClose();
  };

  const TAB_STYLES = (active: boolean, color: string) =>
    `px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
      active
        ? `${color} border`
        : 'bg-bg-dark text-neutral hover:text-secondary border border-border-card'
    }`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-lg">
        {view === 'list' ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-primary" />
                <span>Historial de la Sesión Activa</span>
              </DialogTitle>

              {/* Cash Box Status Widget */}
              <div className="bg-bg-dark/40 border border-border-card p-3.5 rounded-xl mb-4 flex justify-between items-center text-xs">
                <div>
                  <div className="text-neutral text-[9px] uppercase tracking-wider font-bold">Efectivo en Caja</div>
                  <div className="text-primary font-extrabold text-base mt-0.5">${currentCashBalance.toFixed(2)}</div>
                </div>
                <div className="text-right text-[10px] text-neutral space-y-0.5">
                  <div>Apertura: <strong className="text-secondary">${Number(activeSession?.openingBalance || 0).toFixed(2)}</strong></div>
                  <div>Ventas Totales: <strong className="text-secondary">${totalSalesSum.toFixed(2)}</strong></div>
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
                  Devoluciones ({refunds.length})
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
                        {activeSession && sale.status !== 'REFUNDED' && (sale.items || []).length > 0 && (
                          <button
                            onClick={() => openRefundView(sale)}
                            title="Procesar devolución"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Devolver
                          </button>
                        )}
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
                refunds.length === 0 ? (
                  <div className="py-12 text-center text-xs text-neutral">No se han procesado devoluciones en esta sesión.</div>
                ) : (
                  refunds.map((refund: any) => {
                    return (
                      <div key={refund.id} className="bg-bg-dark/40 border border-rose-500/20 p-3 rounded-xl animate-fade-in space-y-2">
                        {/* Header */}
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
                        {/* Items */}
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
                        {/* Reason + time */}
                        <div className="flex justify-between items-end">
                          <span className="text-[9px] text-neutral italic truncate max-w-[60%]">"{refund.reason}"</span>
                          <span className="text-[9px] text-neutral shrink-0">
                            {new Date(refund.createdAt).toLocaleTimeString(undefined, { timeZone: timezone })}
                          </span>
                        </div>
                      </div>
                    );
                  })
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
                  <span className="text-neutral">Total Reembolsado:</span>
                  <span className="text-rose-500 text-sm">-${totalRefundsSum.toFixed(2)}</span>
                </>
              )}
            </div>
          </>
        ) : (
          /* ──────────── REFUND SUB-VIEW ──────────── */
          <>
            <DialogHeader>
              <DialogTitle className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2 mb-1">
                <RotateCcw className="w-4 h-4 text-rose-500" />
                <span>Procesar Devolución</span>
              </DialogTitle>
              <div className="flex items-center gap-2 pb-2">
                <button
                  onClick={closeRefundView}
                  className="flex items-center gap-1 text-[10px] text-neutral hover:text-secondary transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Volver al historial
                </button>
                <span className="text-neutral text-[10px]">•</span>
                <span className="text-[10px] text-neutral font-mono">{selectedSale?.invoiceNumber}</span>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* Items list */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(selectedSale?.items || []).map((item: any) => {
                  const qty = refundQtys[item.variantId] || 0;
                  const maxQty = Number(item.quantity);
                  return (
                    <div key={item.variantId} className="flex items-center justify-between bg-bg-dark/50 border border-border-card rounded-xl px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-secondary truncate">
                          {item.variant?.product?.name || item.variantName || item.variantId}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-neutral">Vendidos: <strong>{maxQty}</strong></span>
                          <span className="text-[9px] text-primary font-mono">${Number(item.price).toFixed(2)}/u</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {qty > 0 && (
                          <Badge variant="destructive" className="text-[9px] h-4 px-1.5 leading-none font-bold">
                            -{(qty * Number(item.price)).toFixed(2)}
                          </Badge>
                        )}
                        <div className="flex items-center gap-1.5 bg-bg-card border border-border-card rounded-lg p-0.5">
                          <button type="button" onClick={() => adjustQty(item.variantId, -1, maxQty)} disabled={qty === 0} className="p-1 rounded hover:bg-bg-dark text-neutral hover:text-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-[11px] font-mono font-bold text-secondary min-w-[14px] text-center">{qty}</span>
                          <button type="button" onClick={() => adjustQty(item.variantId, 1, maxQty)} disabled={qty >= maxQty} className="p-1 rounded hover:bg-bg-dark text-neutral hover:text-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer">
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral uppercase tracking-wider block">
                  Motivo de la Devolución <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Ej: Producto defectuoso, error en el pedido..."
                  rows={2}
                  className="w-full bg-bg-dark border border-border-card rounded-xl px-3 py-2 text-xs text-secondary resize-none focus:outline-none focus:border-rose-500/50 placeholder-neutral transition-all"
                />
              </div>

              {/* Totals summary */}
              {totalRefundItems > 0 && (
                <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="text-[11px] text-rose-400 font-semibold">{totalRefundItems} artículo(s) a devolver</span>
                  </div>
                  <span className="text-sm font-extrabold text-rose-500 font-mono">-${calcRefundTotal().toFixed(2)}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={closeRefundView} className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-border-card text-neutral hover:text-secondary hover:bg-bg-dark transition-all cursor-pointer">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRefund}
                  disabled={isProcessing || totalRefundItems === 0}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" />Procesando...</>
                  ) : (
                    <><CheckCircle className="w-3.5 h-3.5" />Confirmar Devolución</>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
