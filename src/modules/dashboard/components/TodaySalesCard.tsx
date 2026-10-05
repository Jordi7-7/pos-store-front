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
    <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      <h3 className="text-base font-semibold text-secondary mb-4">Ventas de hoy</h3>
      
      <div className="space-y-4">
        {/* Total Sales Box */}
        <div className="p-4 rounded-xl bg-bg-dark/50 border border-border-card/60 flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral font-medium mb-1">Total vendido</p>
            <p className="text-2xl font-black text-secondary tracking-tight">{formattedSales}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Sold Items Box */}
        <div className="p-4 rounded-xl bg-bg-dark/50 border border-border-card/60 flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral font-medium mb-1">Productos vendidos</p>
            <p className="text-2xl font-black text-secondary tracking-tight">
              {itemsCount || 0} <span className="text-sm font-normal text-neutral">unidades</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
