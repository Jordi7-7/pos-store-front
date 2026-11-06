import React from 'react';
import { ShoppingBag, Coins, Info } from 'lucide-react';
import type { CashSessionDetailsVM } from '../../view-models/cash-session.vm';

/** Explicación de cómo se calcula cada cifra de la sesión. */
interface AuditFormulasGuideProps {
  details: CashSessionDetailsVM;
  onClose: () => void;
}

export const AuditFormulasGuide: React.FC<AuditFormulasGuideProps> = ({ details, onClose }) => {
  return (
      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs space-y-3 animate-in fade-in-50 duration-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-primary">
            <Info className="w-4 h-4 shrink-0" />
            <span>Cómo se calculan las cifras de este turno</span>
          </div>
          <button
            type="button"
            onClick={() => onClose()}
            className="text-xs text-neutral hover:text-primary cursor-pointer font-semibold"
          >
            Cerrar guía
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Fórmula 1: Efectivo Físico en Gaveta */}
          <div className="p-3.5 rounded-xl bg-card border border-border-card space-y-2">
            <div className="flex items-center justify-between font-bold text-secondary text-xs">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-primary" />
                1. Arqueo de Efectivo en Gaveta (Físico)
              </span>
              <span className="font-mono text-primary font-black">
                {details.session.expectedBalanceFormatted}
              </span>
            </div>
            <div className="text-xs font-mono bg-bg-dark/70 p-2.5 rounded-lg border border-border-card text-neutral leading-relaxed">
              <div className="text-secondary font-bold mb-1">Cálculo matemático:</div>
              <div>(+) Fondo Inicial: <span className="text-secondary font-bold">{details.session.openingBalanceFormatted}</span></div>
              <div>(+) Cobros Efectivo: <span className="text-emerald-600 font-bold">{details.kpis.cashSalesFormatted}</span></div>
              <div>(-) Gastos en Caja: <span className="text-rose-500 font-bold">{details.kpis.totalExpensesFormatted}</span></div>
              <div>(-) Devoluciones Efec: <span className="text-amber-600 font-bold">{details.kpis.totalRefundsFormatted}</span></div>
              <div className="border-t border-border-card/60 pt-1 mt-1 font-bold text-primary flex justify-between">
                <span>(=) Efectivo Esperado:</span>
                <span>{details.session.expectedBalanceFormatted}</span>
              </div>
            </div>
            <p className="text-xs text-neutral leading-tight">
              * Solo cuenta el flujo que entra y sale de la gaveta física. Las ventas con tarjeta no se suman al cajón porque se depositan directamente en la cuenta bancaria.
            </p>
          </div>

          {/* Fórmula 2: Ventas Netas Comerciales */}
          <div className="p-3.5 rounded-xl bg-card border border-border-card space-y-2">
            <div className="flex items-center justify-between font-bold text-secondary text-xs">
              <span className="flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                2. Ventas Netas del Negocio (Comercial)
              </span>
              <span className="font-mono text-emerald-600 font-black">
                {details.kpis.netSalesFormatted}
              </span>
            </div>
            <div className="text-xs font-mono bg-bg-dark/70 p-2.5 rounded-lg border border-border-card text-neutral leading-relaxed">
              <div className="text-secondary font-bold mb-1">Cálculo comercial:</div>
              <div>(+) Ventas Efectivo: <span className="text-emerald-600 font-bold">{details.kpis.cashSalesFormatted}</span></div>
              <div>(+) Ventas Tarjeta: <span className="text-secondary font-bold">{details.kpis.cardSalesFormatted}</span></div>
              <div>(-) Devoluciones Totales: <span className="text-amber-600 font-bold">{details.kpis.totalRefundsFormatted}</span></div>
              <div className="border-t border-border-card/60 pt-1 mt-1 font-bold text-emerald-600 flex justify-between">
                <span>(=) Total Ventas Netas:</span>
                <span>{details.kpis.netSalesFormatted}</span>
              </div>
            </div>
            <p className="text-xs text-neutral leading-tight">
              * Facturación neta comercial que generó la tienda en este turno sumando todos los métodos de pago (Efectivo + Tarjeta) menos devoluciones.
            </p>
          </div>
        </div>
      </div>
  );
};
