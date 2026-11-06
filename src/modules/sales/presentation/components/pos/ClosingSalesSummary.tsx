import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { formatMoney } from '@/modules/auth/presentation/hooks/useSession';
import type { ClosingSummary } from '@/modules/cash-sessions/domain/rules/closing-summary';

/** Resumen general de ventas del turno. */
interface ClosingSalesSummaryProps {
  summary: ClosingSummary;
}

export const ClosingSalesSummary: React.FC<ClosingSalesSummaryProps> = ({ summary: { cashSales, cardSales, refundsTotal, netSales, salesCount, avgTicket, totalPieces } }) => {
  return (
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
  );
};
