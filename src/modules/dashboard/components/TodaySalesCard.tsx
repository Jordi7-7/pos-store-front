import React from 'react';
import { DollarSign, Package, RotateCcw } from 'lucide-react';

interface TodaySalesCardProps {
  totalSales: number;
  itemsCount: number;
  netSales?: number;
  netItemsCount?: number;
  refunds?: {
    totalRefunded: number;
    itemsCount: number;
    count: number;
  };
}

export const TodaySalesCard: React.FC<TodaySalesCardProps> = ({
  totalSales,
  itemsCount,
  netSales,
  refunds,
}) => {
  const hasRefunds = (refunds?.totalRefunded || 0) > 0;
  const effectiveNetSales = netSales !== undefined ? netSales : totalSales;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount || 0);

  return (
    <div className="bg-bg-card border border-border-card rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-secondary">Ventas de hoy</h3>
        {hasRefunds && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            {refunds?.count || 1} dev. hoy
          </span>
        )}
      </div>

      <div className="space-y-2 my-auto">
        {/* Total Neto o Principal */}
        <div className="p-3 rounded-xl bg-bg-dark/50 border border-border-card/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral font-medium uppercase tracking-wider">
              {hasRefunds ? 'Venta Neta' : 'Total vendido'}
            </p>
            <p className="text-xl font-black text-secondary tracking-tight">
              {formatCurrency(effectiveNetSales)}
            </p>
            {hasRefunds && (
              <p className="text-[10px] text-neutral mt-0.5">
                Bruto: {formatCurrency(totalSales)}
              </p>
            )}
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        {/* Breakdown de Devoluciones (si hubo hoy) */}
        {hasRefunds && (
          <div className="px-3 py-2 rounded-xl bg-rose-500/5 border border-rose-500/15 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-rose-500 font-medium">
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span>Devoluciones:</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-rose-500">
                -{formatCurrency(refunds?.totalRefunded || 0)}
              </span>
              <span className="text-[10px] text-rose-400 block leading-tight">
                {refunds?.itemsCount || 0} {refunds?.itemsCount === 1 ? 'unidad' : 'unidades'} dev.
              </span>
            </div>
          </div>
        )}

        {/* Sold Items Box */}
        <div className="p-2.5 rounded-xl bg-bg-dark/50 border border-border-card/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral font-medium uppercase tracking-wider">
              Productos vendidos
            </p>
            <p className="text-base font-black text-secondary tracking-tight">
              {itemsCount || 0} <span className="text-xs font-normal text-neutral">unidades</span>
            </p>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Package className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
