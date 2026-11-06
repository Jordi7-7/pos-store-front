import React from 'react';
import { Coins } from 'lucide-react';
import { formatMoney } from '@/modules/auth/presentation/hooks/useSession';
import type { ClosingSummary } from '@/modules/cash-sessions/domain/rules/closing-summary';

/** Arqueo de efectivo del cajón: fondo inicial, cobros, gastos y devoluciones hasta el efectivo esperado. */
interface ClosingCashAuditProps {
  summary: ClosingSummary;
}

export const ClosingCashAudit: React.FC<ClosingCashAuditProps> = ({ summary: { openingBalance, cashSales, expensesTotal, refundsTotal, expectedCash: expectedCashInDrawer } }) => {
  return (
    <div className="bg-bg-dark/60 border border-border-card p-3 rounded-xl space-y-2 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-1.5 border-b border-border-card/60">
 <span className="text-xs font-bold text-secondary flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-primary" />
            Arqueo de Efectivo (Cajón)
          </span>
          <span className="text-xs font-bold text-neutral">Físico</span>
        </div>

        <div className="mt-2 space-y-1 font-mono text-xs leading-tight">
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
 <span className="text-xs font-bold text-primary ">
          (=) Efectivo Esperado:
        </span>
        <span className="font-mono text-base font-black text-primary">
          {formatMoney(expectedCashInDrawer)}
        </span>
      </div>
    </div>
  );
};
