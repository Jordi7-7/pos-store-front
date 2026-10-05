import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface DayBreakdown {
  dayKey: string;
  label: string;
  total: number;
}

interface WeeklySummaryCardProps {
  data: {
    totalWeek: number;
    changePercentage: number;
    dailyBreakdown: DayBreakdown[];
  };
}

export const WeeklySummaryCard: React.FC<WeeklySummaryCardProps> = ({ data }) => {
  const isPositive = (data?.changePercentage || 0) >= 0;

  const formattedWeekTotal = new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(data?.totalWeek || 0);

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const formatted = new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(val || 0);

      return (
        <div className="bg-bg-card border border-border-card p-2.5 rounded-xl shadow-lg">
          <p className="text-[11px] font-semibold text-neutral mb-0.5">{label}</p>
          <p className="text-xs font-bold text-primary">{formatted}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-secondary">Resumen de la semana</h3>
            <p className="text-[11px] text-neutral">Comportamiento de ventas diario (Lunes - Domingo)</p>
          </div>
        </div>

        {/* Total & Comparative badge */}
        <div className="flex items-center gap-4 bg-bg-dark/50 border border-border-card/60 p-3 rounded-xl">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral">Total Semana</span>
            <p className="text-lg font-black text-secondary">{formattedWeekTotal}</p>
          </div>
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-600 border border-red-500/20'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>
              {isPositive ? '+' : ''}
              {data?.changePercentage || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data?.dailyBreakdown || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#888888' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#888888' }}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip content={customTooltip} cursor={{ fill: 'rgba(0, 0, 0, 0.04)', radius: 8 }} />
            <Bar dataKey="total" fill="var(--color-primary, #6366f1)" radius={[6, 6, 0, 0]} maxBarSize={45} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
