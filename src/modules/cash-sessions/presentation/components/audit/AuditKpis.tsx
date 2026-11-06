import React from 'react';
import { ShoppingBag, TrendingDown, RotateCcw, Coins, Receipt, DollarSign, Info } from 'lucide-react';
import type { CashSessionDetailsEntity } from '../../../domain/entities';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

/** Cifras principales del turno: apertura, ventas, gastos, devoluciones, esperado y arqueo. */
interface AuditKpisProps {
  details: CashSessionDetailsEntity;
}

export const AuditKpis: React.FC<AuditKpisProps> = ({ details }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Fondo de Apertura */}
      <div className="p-3.5 bg-bg-dark border border-border-card rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-neutral mb-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Apertura</span>
            <Tooltip>
              <TooltipTrigger className="text-neutral/60 hover:text-primary transition-colors cursor-help inline-flex items-center">
                <Info className="w-3 h-3" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] p-2.5 text-xs bg-popover text-popover-foreground border border-border shadow-lg">
                <p className="font-bold text-foreground mb-0.5">Fondo Inicial de Caja</p>
                <p className="text-muted-foreground text-[11px] leading-tight">
                  Efectivo base asignado al cajón al abrir el turno para poder dar cambio a los clientes.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Coins className="w-3.5 h-3.5 text-neutral" />
        </div>
        <div>
          <span className="text-base sm:text-lg font-black font-mono text-secondary">
            {details.session.openingBalanceFormatted}
          </span>
          <span className="text-[10px] text-neutral block mt-0.5">Base en caja</span>
        </div>
      </div>

      {/* 2. Ventas Netas */}
      <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-600 mb-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Ventas Netas
            </span>
            <Tooltip>
              <TooltipTrigger className="text-emerald-600/60 hover:text-emerald-600 transition-colors cursor-help inline-flex items-center">
                <Info className="w-3 h-3" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[230px] p-2.5 text-xs bg-popover text-popover-foreground border border-border shadow-lg">
                <p className="font-bold text-foreground mb-0.5">Ventas Netas del Turno</p>
                <p className="text-muted-foreground text-[11px] leading-tight mb-1">
                  Facturación comercial neta total en todos los medios de pago:
                </p>
                <p className="font-mono text-[10px] bg-muted/60 p-1 rounded font-bold text-emerald-600">
                  (Efectivo + Tarjeta) - Devoluciones
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <ShoppingBag className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="text-base sm:text-lg font-black font-mono text-emerald-600">
            {details.kpis.netSalesFormatted}
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-medium text-emerald-700/80 mt-0.5">
            <span>Ef: {details.kpis.cashSalesFormatted}</span>
            <span>•</span>
            <span>Tarj: {details.kpis.cardSalesFormatted}</span>
          </div>
        </div>
      </div>

      {/* 3. Gastos / Salidas */}
      <div className="p-3.5 bg-rose-500/5 border border-rose-500/15 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-rose-500 mb-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Gastos / Retiros
            </span>
            <Tooltip>
              <TooltipTrigger className="text-rose-500/60 hover:text-rose-500 transition-colors cursor-help inline-flex items-center">
                <Info className="w-3 h-3" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[220px] p-2.5 text-xs bg-popover text-popover-foreground border border-border shadow-lg">
                <p className="font-bold text-foreground mb-0.5">Salidas de Efectivo</p>
                <p className="text-muted-foreground text-[11px] leading-tight">
                  Total de dinero físico retirado del cajón durante el turno para compras menores, pagos o retiros autorizados.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <TrendingDown className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="text-base sm:text-lg font-black font-mono text-rose-500">
            {details.kpis.totalExpensesFormatted}
          </span>
          <span className="text-[10px] text-rose-500/80 block mt-0.5">
            {details.kpis.expensesLabel}
          </span>
        </div>
      </div>

      {/* 4. Devoluciones */}
      <div className="p-3.5 bg-amber-500/5 border border-amber-500/15 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-amber-600 mb-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Devoluciones
            </span>
            <Tooltip>
              <TooltipTrigger className="text-amber-600/60 hover:text-amber-600 transition-colors cursor-help inline-flex items-center">
                <Info className="w-3 h-3" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[230px] p-2.5 text-xs bg-popover text-popover-foreground border border-border shadow-lg">
                <p className="font-bold text-foreground mb-0.5">Reembolsos de Efectivo</p>
                <p className="text-muted-foreground text-[11px] leading-tight">
                  Efectivo devuelto a clientes en este turno por cancelaciones o prendas retornadas. Se resta del cajón.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <RotateCcw className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="text-base sm:text-lg font-black font-mono text-amber-600">
            {details.kpis.totalRefundsFormatted}
          </span>
          <span className="text-[10px] text-amber-600/80 block mt-0.5">
            {details.kpis.refundsLabel}
          </span>
        </div>
      </div>

      {/* 5. Esperado en Caja */}
      <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-primary mb-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Efectivo Esperado
            </span>
            <Tooltip>
              <TooltipTrigger className="text-primary/60 hover:text-primary transition-colors cursor-help inline-flex items-center">
                <Info className="w-3 h-3" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[250px] p-2.5 text-xs bg-popover text-popover-foreground border border-border shadow-lg">
                <p className="font-bold text-foreground mb-0.5">Fórmula de Efectivo en Gaveta</p>
                <p className="font-mono text-[10px] bg-muted/60 p-1 rounded font-bold text-primary mb-1">
                  Apertura + Cobros Efec - Gastos - Devoluciones
                </p>
                <p className="text-muted-foreground text-[11px] leading-tight">
                  Cantidad física exacta en billetes y monedas que debe haber en la gaveta al momento del cierre.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Receipt className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="text-base sm:text-lg font-black font-mono text-primary">
            {details.session.expectedBalanceFormatted}
          </span>
          <span className="text-[10px] text-primary/80 block mt-0.5">
            Físico en gaveta
          </span>
        </div>
      </div>

      {/* 6. Arqueo y Diferencia */}
      <div className="p-3.5 bg-bg-dark border border-border-card rounded-2xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-neutral mb-2">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Arqueo Cierre
            </span>
            <Tooltip>
              <TooltipTrigger className="text-neutral/60 hover:text-primary transition-colors cursor-help inline-flex items-center">
                <Info className="w-3 h-3" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px] p-2.5 text-xs bg-popover text-popover-foreground border border-border shadow-lg">
                <p className="font-bold text-foreground mb-0.5">Efectivo Contado y Cuadre</p>
                <p className="text-muted-foreground text-[11px] leading-tight mb-1">
                  Dinero real contado físicamente por el cajero al momento del cierre.
                </p>
                <p className="font-mono text-[10px] bg-muted/60 p-1 rounded font-bold text-secondary">
                  Diferencia = Contado - Esperado
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <DollarSign className="w-3.5 h-3.5 text-neutral" />
        </div>
        <div>
          {details.session.isClosed ? (
            <>
              <span className="text-base sm:text-lg font-black font-mono text-secondary">
                {details.session.closingBalanceFormatted}
              </span>
              <span
                className={`text-[10px] font-bold block mt-0.5 ${
                  details.session.differenceStatus === 'EXACT'
                    ? 'text-emerald-600'
                    : details.session.differenceStatus === 'SURPLUS'
                    ? 'text-blue-500'
                    : 'text-rose-500'
                }`}
              >
                {details.session.differenceStatusText}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm font-bold text-neutral">Pendiente</span>
              <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">
                {details.session.differenceStatusText}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
