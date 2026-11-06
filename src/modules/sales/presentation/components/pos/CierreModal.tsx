import React, { useMemo, useState } from 'react';
import {
  Loader2,
  Info,
  DollarSign,
  Receipt,
  ShoppingBag,
  Layers,
  Coins,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTimezone } from '../../../../auth/hooks/useSession';
import type {
  CashSessionHeader,
  ClosingDetailsStatus,
  CashSessionDetails,
  SessionSale,
  SessionExpense,
  SessionRefund,
} from '@/modules/cash-sessions/domain/session-types';
import { formatMoney } from '@/modules/auth/hooks/useSession';
import {
  cashDifference,
  classifyDifference,
  expectedCashBalance,
  parseCountedCash,
  summarizeCashSession,
} from '@/modules/cash-sessions/domain/cash-closing';


interface CierreModalProps {
  isOpen: boolean;
  onClose: () => void;
  closingBalance: string;
  setClosingBalance: (val: string) => void;
  onCloseSession: () => void;
  isClosing: boolean;
  activeSession: CashSessionHeader | null;
  sessionDetails?: CashSessionDetails | null;
  detailsStatus: ClosingDetailsStatus;
  activeSessionSales: SessionSale[];
  activeSessionExpenses: SessionExpense[];
  activeSessionRefunds: SessionRefund[];
}

interface ProductSummaryItem {
  sku: string;
  name: string;
  quantity: number;
  total: number;
}

type TabType = 'sales' | 'products' | 'expenses' | 'refunds';

export const CierreModal: React.FC<CierreModalProps> = ({
  isOpen,
  onClose,
  closingBalance,
  setClosingBalance,
  onCloseSession,
  isClosing,
  activeSession,
  sessionDetails,
  detailsStatus,
  activeSessionSales,
  activeSessionExpenses,
  activeSessionRefunds,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('sales');
  const timezone = useTimezone();

  // 1. Cálculos de Productos Vendidos (agrupados por SKU)
  const productsSummary = useMemo(() => {
    const summary: Record<string, ProductSummaryItem> = {};

    activeSessionSales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const sku = item.variant?.sku || 'N/A';
        const productName = item.variant?.product?.name || 'Producto';
        const variantAttrs = (item.variant?.attributeValues || [])
          .map((av) => av.value)
          .filter(Boolean)
          .join(' · ');
        const fullName = variantAttrs ? `${productName} (${variantAttrs})` : productName;

        if (!summary[sku]) {
          summary[sku] = {
            sku,
            name: fullName,
            quantity: 0,
            total: 0,
          };
        }
        summary[sku].quantity += Number(item.quantity || 0);
        const itemDiscount = Number(item.discountAmount || 0);
        summary[sku].total += (Number(item.price || 0) - itemDiscount) * Number(item.quantity || 0);
      });
    });

    return Object.values(summary);
  }, [activeSessionSales]);

  const totalPieces = useMemo(() => {
    return productsSummary.reduce((sum, p) => sum + p.quantity, 0);
  }, [productsSummary]);

  // 2. Fuente de la verdad de montos (coincide 1:1 con backend y Ticket de Cierre)
  const openingBalance = sessionDetails?.session?.openingBalance !== undefined
    ? Number(sessionDetails.session.openingBalance)
    : Number(activeSession?.openingBalance || 0);

  const fallbackTotals = useMemo(
    () =>
      summarizeCashSession({
        sales: activeSessionSales,
        expenseAmounts: activeSessionExpenses.map((e) => e.amount),
        refundAmounts: activeSessionRefunds.map((r) => r.totalRefunded),
      }),
    [activeSessionSales, activeSessionExpenses, activeSessionRefunds],
  );
  const fallbackCashSales = fallbackTotals.cashSales;
  const fallbackCardSales = fallbackTotals.cardSales;

  const cashSales = sessionDetails?.kpis?.cashSales !== undefined
    ? Number(sessionDetails.kpis.cashSales)
    : fallbackCashSales;

  const cardSales = sessionDetails?.kpis?.cardSales !== undefined
    ? Number(sessionDetails.kpis.cardSales)
    : fallbackCardSales;

  const expensesTotal = sessionDetails?.kpis?.totalExpenses !== undefined
    ? Number(sessionDetails.kpis.totalExpenses)
    : activeSessionExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const refundsTotal = sessionDetails?.kpis?.totalRefunds !== undefined
    ? Number(sessionDetails.kpis.totalRefunds)
    : activeSessionRefunds.reduce((sum, r) => sum + Number(r.totalRefunded || 0), 0);

  const netSales = sessionDetails?.kpis?.netSales !== undefined
    ? Number(sessionDetails.kpis.netSales)
    : (cashSales + cardSales - refundsTotal);

  const expectedCashInDrawer = sessionDetails?.session?.expectedBalance !== undefined && sessionDetails?.session?.expectedBalance !== null
    ? Number(sessionDetails.session.expectedBalance)
    : expectedCashBalance({ openingBalance, cashSales, expenses: expensesTotal, refunds: refundsTotal });

  const salesCount = sessionDetails?.kpis?.salesCount !== undefined
    ? Number(sessionDetails.kpis.salesCount)
    : activeSessionSales.length;

  const avgTicket = salesCount > 0 ? netSales / salesCount : 0;

  // 3. Diferencia y cuadre en tiempo real (solo con el resumen del turno cargado)
  const isReady = detailsStatus === 'ready';
  const countedCash = parseCountedCash(closingBalance);
  const difference = isReady && countedCash !== null ? cashDifference(countedCash, expectedCashInDrawer) : null;
  const differenceKind = difference === null ? null : classifyDifference(difference);
  const isExact = differenceKind === 'EXACT';
  const isSurplus = differenceKind === 'SURPLUS';
  const isShortage = differenceKind === 'SHORTAGE';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-xl bg-card border border-border text-card-foreground rounded-2xl shadow-2xl p-5 max-h-[92vh] flex flex-col">
        {/* Encabezado */}
        <DialogHeader className="border-b border-border pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <span>Cierre de Caja Registradora (Corte Z)</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              {activeSession?.cashRegister?.name && (
                <span className="text-[10px] text-neutral bg-bg-dark border border-border-card px-2 py-0.5 rounded-lg font-medium">
                  Caja: <strong className="text-secondary">{activeSession.cashRegister.name}</strong>
                </span>
              )}
              {activeSession?.user?.name && (
                <span className="text-[10px] text-neutral bg-bg-dark border border-border-card px-2 py-0.5 rounded-lg font-medium">
                  Cajero: <strong className="text-secondary">{activeSession.user.name}</strong>
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Contenedor desplazable */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 py-3 min-h-0 text-xs">
          
          {!isReady && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-600">
              {detailsStatus === 'loading' ? (
                <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <p className="text-[11px] font-medium leading-snug">
                {detailsStatus === 'loading'
                  ? 'Cargando el resumen del turno…'
                  : 'No se pudo cargar el resumen del turno (efectivo esperado y movimientos). Puedes cerrar la caja contando el efectivo; el sistema calculará la diferencia. Si falla siempre, pide a un administrador el permiso para consultar sesiones de caja.'}
              </p>
            </div>
          )}

          {isReady && (<>
          {/* Bloques principales sincronizados 1:1 con el Ticket Térmico de Cierre */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* 1. ARQUEO DE EFECTIVO (CAJÓN) */}
            <div className="bg-bg-dark/60 border border-border-card p-3 rounded-xl space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-border-card/60">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-primary" />
                    Arqueo de Efectivo (Cajón)
                  </span>
                  <span className="text-[9px] font-bold text-neutral">Físico</span>
                </div>

                <div className="mt-2 space-y-1 font-mono text-[11px] leading-tight">
                  <div className="flex justify-between text-neutral">
                    <span>(+) Fondo Inicial:</span>
                    <span className="text-secondary font-semibold">{formatMoney(openingBalance)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>(+) Cobros Efectivo:</span>
                    <span className="font-semibold">+{formatMoney(cashSales)}</span>
                  </div>
                  <div className="flex justify-between text-rose-500">
                    <span>(-) Gastos en Caja:</span>
                    <span className="font-semibold">-{formatMoney(expensesTotal)}</span>
                  </div>
                  {refundsTotal > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>(-) Devoluciones Efec:</span>
                      <span className="font-semibold">-{formatMoney(refundsTotal)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border-card/80 pt-2 flex justify-between items-center">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  (=) Efectivo Esperado:
                </span>
                <span className="font-mono text-base font-black text-primary">
                  {formatMoney(expectedCashInDrawer)}
                </span>
              </div>
            </div>

            {/* 2. RESUMEN GENERAL DE VENTAS */}
            <div className="bg-bg-dark/60 border border-border-card p-3 rounded-xl space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-border-card/60">
                  <span className="text-[10px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                    Resumen General Ventas
                  </span>
                  <span className="text-[9px] font-bold text-neutral">Comercial</span>
                </div>

                <div className="mt-2 space-y-1 font-mono text-[11px] leading-tight">
                  <div className="flex justify-between text-neutral">
                    <span>Tickets Emitidos:</span>
                    <span className="text-secondary font-semibold">{salesCount}</span>
                  </div>
                  <div className="flex justify-between text-neutral">
                    <span>Piezas Vendidas:</span>
                    <span className="text-secondary font-semibold">{totalPieces}</span>
                  </div>
                  <div className="flex justify-between text-neutral">
                    <span>Ticket Promedio:</span>
                    <span className="text-secondary font-semibold">{formatMoney(avgTicket)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Ventas Efectivo:</span>
                    <span className="font-semibold">{formatMoney(cashSales)}</span>
                  </div>
                  <div className="flex justify-between text-blue-500">
                    <span>Ventas Tarjeta/Dig:</span>
                    <span className="font-semibold">{formatMoney(cardSales)}</span>
                  </div>
                  {refundsTotal > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>(-) Devoluciones:</span>
                      <span className="font-semibold">-{formatMoney(refundsTotal)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-border-card/80 pt-2 flex justify-between items-center">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  Total Ventas Netas:
                </span>
                <span className="font-mono text-base font-black text-emerald-600">
                  {formatMoney(netSales)}
                </span>
              </div>
            </div>

          </div>

          {/* Desglose de Movimientos por Pestañas */}
          <div className="border border-border-card rounded-xl bg-bg-dark/30 p-2.5 space-y-2">
            <div className="flex items-center justify-between border-b border-border-card/60 pb-1.5">
              <span className="text-[10px] text-neutral uppercase font-bold tracking-wider flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-primary" /> Desglose de Movimientos
              </span>

              {/* Botones de Pestañas */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('sales')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                    activeTab === 'sales'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-neutral hover:text-secondary'
                  }`}
                >
                  Ventas ({salesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                    activeTab === 'products'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-neutral hover:text-secondary'
                  }`}
                >
                  Artículos ({productsSummary.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('expenses')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                    activeTab === 'expenses'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-neutral hover:text-secondary'
                  }`}
                >
                  Gastos ({activeSessionExpenses.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('refunds')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                    activeTab === 'refunds'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-neutral hover:text-secondary'
                  }`}
                >
                  Devoluciones ({activeSessionRefunds.length})
                </button>
              </div>
            </div>

            {/* Contenido de cada pestaña */}
            <div className="max-h-36 overflow-y-auto pr-1">
              
              {/* Pestaña: Ventas */}
              {activeTab === 'sales' && (
                activeSessionSales.length === 0 ? (
                  <span className="text-[10.5px] text-neutral italic block py-2 text-center">
                    Sin ventas en este turno
                  </span>
                ) : (
                  <div className="space-y-1.5">
                    {activeSessionSales.map((sale) => {
                      const timeStr = new Date(sale.createdAt).toLocaleTimeString(undefined, {
                        timeZone: timezone,
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      });
                      
                      // Deduplicar métodos de pago (evita 'EFECTIVO/EFECTIVO')
                      const uniqueMethods = Array.from(
                        new Set(
                          (sale.payments || []).map((p) => p.paymentMethod).filter(Boolean)
                        )
                      );
                      const methodsStr = uniqueMethods.length > 0 ? uniqueMethods.join('/') : sale.paymentMethod;

                      return (
                        <div
                          key={sale.id}
                          className="flex justify-between items-center text-[10.5px] border-b border-border-card/40 pb-1 last:border-b-0 last:pb-0 font-mono"
                        >
                          <div className="flex items-center gap-1.5 truncate max-w-[280px]">
                            <span className="text-neutral">[{timeStr}]</span>
                            <span className="text-secondary font-semibold">{sale.invoiceNumber}</span>
                            <span className="text-[9px] px-1 py-0.2 rounded bg-bg-dark text-neutral border border-border-card">
                              {methodsStr}
                            </span>
                            {sale.status === 'REFUNDED' && (
                              <span className="text-[9px] px-1 rounded bg-rose-500/10 text-rose-500 font-sans font-bold">
                                Reembolsada
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-secondary">
                            {formatMoney(Number(sale.total || 0))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* Pestaña: Artículos Vendidos */}
              {activeTab === 'products' && (
                productsSummary.length === 0 ? (
                  <span className="text-[10.5px] text-neutral italic block py-2 text-center">
                    Sin artículos vendidos en este turno
                  </span>
                ) : (
                  <div className="space-y-1.5">
                    {productsSummary.map((prod) => (
                      <div
                        key={prod.sku}
                        className="flex justify-between items-center text-[10.5px] border-b border-border-card/40 pb-1 last:border-b-0 last:pb-0"
                      >
                        <div className="truncate max-w-[280px]">
                          <span className="font-mono font-bold text-primary mr-1.5">{prod.sku}</span>
                          <span className="text-secondary uppercase">{prod.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 font-mono">
                          <span className="text-neutral text-[10px]">x{prod.quantity}</span>
                          <span className="font-bold text-secondary">{formatMoney(prod.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Pestaña: Gastos */}
              {activeTab === 'expenses' && (
                activeSessionExpenses.length === 0 ? (
                  <span className="text-[10.5px] text-neutral italic block py-2 text-center">
                    Sin gastos en este turno
                  </span>
                ) : (
                  <div className="space-y-1.5">
                    {activeSessionExpenses.map((exp) => {
                      const timeStr = new Date(exp.createdAt).toLocaleTimeString(undefined, {
                        timeZone: timezone,
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      });
                      return (
                        <div
                          key={exp.id}
                          className="flex justify-between items-center text-[10.5px] border-b border-border-card/40 pb-1 last:border-b-0 last:pb-0 font-mono"
                        >
                          <div className="truncate max-w-[280px]">
                            <span className="text-neutral mr-1.5">[{timeStr}]</span>
                            <span className="text-secondary font-sans">{exp.description}</span>
                          </div>
                          <span className="font-bold text-rose-500">
                            -{formatMoney(Number(exp.amount || 0))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {/* Pestaña: Devoluciones */}
              {activeTab === 'refunds' && (
                activeSessionRefunds.length === 0 ? (
                  <span className="text-[10.5px] text-neutral italic block py-2 text-center">
                    Sin devoluciones en este turno
                  </span>
                ) : (
                  <div className="space-y-1.5">
                    {activeSessionRefunds.map((refund) => {
                      const timeStr = new Date(refund.createdAt).toLocaleTimeString(undefined, {
                        timeZone: timezone,
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      });
                      return (
                        <div
                          key={refund.id}
                          className="flex justify-between items-center text-[10.5px] border-b border-border-card/40 pb-1 last:border-b-0 last:pb-0 font-mono"
                        >
                          <div className="truncate max-w-[280px]">
                            <span className="text-neutral mr-1.5">[{timeStr}]</span>
                            <span className="text-secondary font-sans">{refund.reason || 'Devolución de prendas'}</span>
                          </div>
                          <span className="font-bold text-amber-600">
                            -{formatMoney(Number(refund.totalRefunded || 0))}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )
              )}

            </div>
          </div>

          </>)}

          {/* Formulario de Conteo de Efectivo Físico y Cuadre */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] text-neutral uppercase tracking-wider font-bold">
                Monto de Cierre Físico en Gaveta ($)
              </label>
              <span className="text-[10px] text-neutral">
                Esperado: <strong className="text-primary font-mono">{formatMoney(expectedCashInDrawer)}</strong>
              </span>
            </div>

            <div className="relative">
              <DollarSign className="w-4 h-4 text-neutral absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="number" 
                step="0.01"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                placeholder="Ingresa el dinero físico contado en el cajón..."
                className="w-full bg-bg-dark border border-border-card rounded-xl py-2.5 pl-9 pr-3.5 text-xs text-foreground font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>

            {/* Banner de Estado del Cuadre */}
            {closingBalance !== '' && difference !== null && (
              <div
                className={`p-2.5 rounded-xl border flex justify-between items-center text-xs font-bold transition-all ${
                  isExact
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                    : isShortage
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                    : isSurplus
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
                    : 'bg-muted/10 border-muted text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isExact ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span className="text-[10px] uppercase tracking-wider">
                    {isExact
                      ? '✓ Caja Cuadrada Exacta'
                      : isShortage
                      ? '⚠ Faltante en Caja'
                      : '▲ Sobrante en Caja'}
                  </span>
                </div>
                <span className="font-mono text-sm font-black">
                  {difference > 0 ? `+${formatMoney(difference)}` : formatMoney(difference)}
                </span>
              </div>
            )}

            <p className="text-[9.5px] text-neutral flex items-center gap-1 leading-normal">
              <Info className="w-3 h-3 text-primary shrink-0" />
              Cuenta el dinero físico real (billetes y monedas) en la gaveta. Al confirmar se generará el ticket de corte Z.
            </p>
          </div>

        </div>

        {/* Botón de Confirmación */}
        <div className="border-t border-border pt-3 shrink-0">
          <button 
            onClick={onCloseSession}
            disabled={isClosing || closingBalance === ''}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isClosing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Cerrar Caja y Emitir Corte Z</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CierreModal;
