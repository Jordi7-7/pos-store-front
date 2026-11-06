import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { formatMoney } from '@/modules/auth/hooks/useSession';
import { useTimezone } from '@/modules/auth/hooks/useSession';
import type { SessionExpense, SessionRefund, SessionSale } from '@/modules/cash-sessions/domain/session-types';
import type { ProductSummaryItem } from '@/modules/cash-sessions/domain/closing-summary';

type TabType = 'sales' | 'products' | 'expenses' | 'refunds';

/** Desglose de ventas, artículos, gastos y devoluciones del turno, por pestañas. */
interface ClosingMovementsProps {
  sales: SessionSale[];
  expenses: SessionExpense[];
  refunds: SessionRefund[];
  productsSummary: ProductSummaryItem[];
  salesCount: number;
}

export const ClosingMovements: React.FC<ClosingMovementsProps> = ({ sales: activeSessionSales, expenses: activeSessionExpenses, refunds: activeSessionRefunds, productsSummary, salesCount }) => {
  const [activeTab, setActiveTab] = useState<TabType>('sales');
  const timezone = useTimezone();

  return (
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
  );
};
