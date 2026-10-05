import React from 'react';
import { DollarSign, Package } from 'lucide-react';

interface TodaySalesCardProps {
  totalSales: number;
  itemsCount: number;
}

export const TodaySalesCard: React.FC<TodaySalesCardProps> = ({ totalSales, itemsCount }) => {
  const formattedSales = new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(totalSales || 0);

  return (
    <div className="bg-bg-card border border-border-card rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-secondary">Ventas de hoy</h3>
      </div>
      
      <div className="space-y-2.5 my-auto">
        {/* Total Sales Box */}
        <div className="p-3 rounded-xl bg-bg-dark/50 border border-border-card/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral font-medium uppercase tracking-wider">Total vendido</p>
            <p className="text-xl font-black text-secondary tracking-tight">{formattedSales}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        {/* Sold Items Box */}
        <div className="p-3 rounded-xl bg-bg-dark/50 border border-border-card/60 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-neutral font-medium uppercase tracking-wider">Productos vendidos</p>
            <p className="text-xl font-black text-secondary tracking-tight">
              {itemsCount || 0} <span className="text-xs font-normal text-neutral">unidades</span>
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Package className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
