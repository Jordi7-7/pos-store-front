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
    <div className="bg-bg-card border border-border-card rounded-2xl p-4 shadow-sm flex flex-col justify-between h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-secondary">Resumen de la semana</h3>
            <p className="text-[10px] text-neutral">Comportamiento diario (Lunes - Domingo)</p>
          </div>
        </div>

        {/* Total & Comparative badge */}
        <div className="flex items-center gap-3 bg-bg-dark/50 border border-border-card/60 px-3 py-1.5 rounded-xl">
          <div>
            <span className="text-[9px] uppercase font-bold text-neutral">Total Semana</span>
            <p className="text-sm font-black text-secondary">{formattedWeekTotal}</p>
          </div>
          <div
            className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-600 border border-red-500/20'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>
              {isPositive ? '+' : ''}
              {data?.changePercentage || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data?.dailyBreakdown || []} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#888888' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: '#888888' }}
              tickFormatter={(val) => `$${val}`}
            />
            <Tooltip content={customTooltip} cursor={{ fill: 'rgba(0, 0, 0, 0.04)', radius: 6 }} />
            <Bar dataKey="total" fill="var(--color-primary, #6366f1)" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
