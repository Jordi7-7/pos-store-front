import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Banknote, CreditCard } from 'lucide-react';

interface PaymentMethodsCardProps {
  data: {
    total: number;
    cash: { amount: number; percentage: number };
    card: { amount: number; percentage: number };
  };
}

const COLORS = ['#10B981', '#3B82F6']; // Verde para Efectivo, Azul para Tarjeta

export const PaymentMethodsCard: React.FC<PaymentMethodsCardProps> = ({ data }) => {
  const chartData = [
    { name: 'Efectivo', value: data?.cash?.amount || 0 },
    { name: 'Tarjeta', value: data?.card?.amount || 0 },
  ];

  const hasData = (data?.total || 0) > 0;
  const displayChartData = hasData ? chartData : [{ name: 'Sin ventas', value: 1 }];
  const displayColors = hasData ? COLORS : ['#E2E8F0'];

  const formattedTotal = new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(data?.total || 0);

  const formattedCash = new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(data?.cash?.amount || 0);

  const formattedCard = new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(data?.card?.amount || 0);

  return (
    <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      <h3 className="text-base font-semibold text-secondary mb-3">Métodos de pago</h3>

      <div className="flex flex-col sm:flex-row items-center gap-6 my-auto">
        {/* Donut Chart with Center Text */}
        <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayChartData}
                innerRadius={50}
                outerRadius={70}
                paddingAngle={hasData ? 3 : 0}
                dataKey="value"
                stroke="none"
              >
                {displayChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={displayColors[index % displayColors.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
            <span className="text-[10px] uppercase font-bold text-neutral">Total</span>
            <span className="text-xs font-black text-secondary tracking-tight truncate max-w-[85px]">
              {formattedTotal}
            </span>
          </div>
        </div>

        {/* Legend / Breakdown */}
        <div className="flex-1 w-full space-y-3">
          {/* Efectivo */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-bg-dark/40 border border-border-card/40">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <div className="flex items-center gap-1.5 text-xs font-medium text-secondary">
                <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                <span>Efectivo</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-secondary">{formattedCash}</p>
              <p className="text-[10px] text-neutral font-medium">{data?.cash?.percentage || 0}%</p>
            </div>
          </div>

          {/* Tarjeta */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-bg-dark/40 border border-border-card/40">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <div className="flex items-center gap-1.5 text-xs font-medium text-secondary">
                <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                <span>Tarjeta</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-secondary">{formattedCard}</p>
              <p className="text-[10px] text-neutral font-medium">{data?.card?.percentage || 0}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
