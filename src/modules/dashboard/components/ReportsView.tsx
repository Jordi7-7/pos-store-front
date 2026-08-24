import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  CreditCard, 
  Loader2, 
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface SummaryData {
  totalSales: number;
  totalCOGS: number;
  grossProfit: number;
  totalPurchases: number;
  totalExpenses: number;
  netProfit: number;
}

interface BreakdownDay {
  date: string;
  sales: number;
  purchases: number;
  expenses: number;
  profit: number;
}

interface ReportsResponse {
  summary: SummaryData;
  breakdown: BreakdownDay[];
}

export const ReportsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportsResponse | null>(null);
  
  // Date states
  const [rangeType, setRangeType] = useState<'month' | 'last-month' | 'last-3' | 'custom'>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Helper to format Date to YYYY-MM-DD
  const formatISODate = (d: Date) => {
    return d.toISOString().split('T')[0];
  };

  const getDatesForRange = () => {
    const today = new Date();
    let start: Date;
    let end: Date = new Date();

    if (rangeType === 'month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (rangeType === 'last-month') {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (rangeType === 'last-3') {
      start = new Date(today.getFullYear(), today.getMonth() - 2, 1);
    } else {
      // custom
      start = customStart ? new Date(customStart) : new Date(today.getFullYear(), today.getMonth(), 1);
      end = customEnd ? new Date(customEnd) : today;
    }

    return {
      startDate: formatISODate(start),
      endDate: formatISODate(end),
    };
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDatesForRange();
      const res = await apiClient.request<ReportsResponse>(
        `/reports/summary?startDate=${startDate}&endDate=${endDate}`
      );
      setData(res);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Error al cargar reporte de estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rangeType !== 'custom') {
      loadData();
    }
  }, [rangeType]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const summary = data?.summary;
  const breakdown = data?.breakdown || [];

  // SVG Chart Calculations
  const maxVal = Math.max(...breakdown.map(b => Math.max(b.sales, b.purchases, b.expenses))) || 10;
  const chartHeight = 150;
  const chartWidth = 500;
  const padding = 20;

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/5 to-bg-card border border-primary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-secondary mb-1">Análisis y Estadísticas</h2>
          <p className="text-xs text-neutral">Consulta los ingresos, costos de mercadería, gastos y rentabilidad.</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={rangeType}
            onChange={(e) => setRangeType(e.target.value as any)}
            className="bg-bg-card border border-border-card text-xs text-secondary rounded-xl px-4 py-2 font-medium focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer outline-none"
          >
            <option value="month">Este Mes</option>
            <option value="last-month">Mes Anterior</option>
            <option value="last-3">Últimos 3 Meses</option>
            <option value="custom">Rango Personalizado</option>
          </select>

          {rangeType === 'custom' && (
            <form onSubmit={handleCustomSubmit} className="flex flex-wrap items-center gap-2">
              <Input
                type="date"
                required
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="text-xs h-8 px-3 w-32 border-border-card"
              />
              <span className="text-xs text-neutral">al</span>
              <Input
                type="date"
                required
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="text-xs h-8 px-3 w-32 border-border-card"
              />
              <Button type="submit" size="sm" className="h-8 px-4 text-xs font-semibold">
                Filtrar
              </Button>
            </form>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-neutral font-medium">Generando reporte de ganancias...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Ventas Totales */}
            <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral uppercase tracking-widest font-semibold">Ventas Totales</span>
                  <div className="p-2 bg-emerald-500/10 rounded-lg"><ShoppingBag className="w-4 h-4 text-emerald-500" /></div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-secondary">${(summary?.totalSales || 0).toFixed(2)}</h3>
                  <p className="text-[9px] text-emerald-600 font-medium flex items-center gap-0.5 mt-1">
                    <ArrowUpRight className="w-3 h-3" /> Ingresos brutos
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Costo Mercancía */}
            <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral uppercase tracking-widest font-semibold">Costo Inventario</span>
                  <div className="p-2 bg-rose-500/10 rounded-lg"><CreditCard className="w-4 h-4 text-rose-500" /></div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-secondary">${(summary?.totalCOGS || 0).toFixed(2)}</h3>
                  <p className="text-[9px] text-neutral font-medium flex items-center gap-0.5 mt-1">
                    Inversión de mercadería vendida
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Ganancia Bruta */}
            <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral uppercase tracking-widest font-semibold">Utilidad Bruta</span>
                  <div className="p-2 bg-primary/10 rounded-lg"><DollarSign className="w-4 h-4 text-primary" /></div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-secondary">${(summary?.grossProfit || 0).toFixed(2)}</h3>
                  <p className="text-[9px] text-primary font-medium flex items-center gap-0.5 mt-1">
                    Retorno neto de catálogo
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Egresos/Gastos */}
            <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral uppercase tracking-widest font-semibold">Egresos / Gastos</span>
                  <div className="p-2 bg-amber-500/10 rounded-lg"><TrendingDown className="w-4 h-4 text-amber-500" /></div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-secondary">${(summary?.totalExpenses || 0).toFixed(2)}</h3>
                  <p className="text-[9px] text-amber-500 font-medium flex items-center gap-0.5 mt-1">
                    Gastos locales de caja chica
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Ganancia Neta */}
            <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm">
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral uppercase tracking-widest font-semibold">Ganancia Neta</span>
                  <div className="p-2 bg-emerald-500/10 rounded-lg"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-emerald-500">${(summary?.netProfit || 0).toFixed(2)}</h3>
                  <p className="text-[9px] text-emerald-600 font-medium flex items-center gap-0.5 mt-1">
                    Utilidad final neta
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* SVG Trend Chart & Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* SVG Chart Card */}
            <Card className="lg:col-span-2 border border-border-card bg-bg-card rounded-2xl shadow-sm p-6">
              <h3 className="text-sm font-bold text-secondary mb-4 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary" /> Tendencia de Ventas vs Compras
              </h3>
              
              {breakdown.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-xs text-neutral">
                  No hay suficientes datos diarios para graficar en este rango.
                </div>
              ) : (
                <div className="w-full flex justify-center">
                  <svg 
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                    className="w-full h-auto overflow-visible"
                    style={{ maxHeight: '200px' }}
                  >
                    {/* Grid lines */}
                    <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="var(--border-card)" strokeDasharray="3,3" />
                    <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="var(--border-card)" strokeDasharray="3,3" />
                    <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="var(--border-card)" />

                    {/* Rendering SVG Points */}
                    {(() => {
                      const numPoints = breakdown.length;
                      const step = (chartWidth - padding * 2) / (numPoints - 1 || 1);

                      // Helper to generate path coordinates
                      const getPath = (key: 'sales' | 'purchases') => {
                        return breakdown.map((day, idx) => {
                          const x = padding + idx * step;
                          const val = day[key];
                          const y = chartHeight - padding - (val / maxVal) * (chartHeight - padding * 2);
                          return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ');
                      };

                      const salesPath = getPath('sales');
                      const purchasesPath = getPath('purchases');

                      return (
                        <>
                          {/* Purchases Line */}
                          {purchasesPath && (
                            <path 
                              d={purchasesPath} 
                              fill="none" 
                              stroke="var(--color-primary)" 
                              strokeWidth="2" 
                              opacity="0.4"
                            />
                          )}
                          
                          {/* Sales Line */}
                          {salesPath && (
                            <path 
                              d={salesPath} 
                              fill="none" 
                              stroke="var(--color-emerald-500, #10b981)" 
                              strokeWidth="2.5" 
                            />
                          )}

                          {/* Data points */}
                          {breakdown.map((day, idx) => {
                            const x = padding + idx * step;
                            const salesY = chartHeight - padding - (day.sales / maxVal) * (chartHeight - padding * 2);
                            return (
                              <g key={day.date} className="group cursor-pointer">
                                <circle cx={x} cy={salesY} r="3" fill="#10b981" />
                                <title>{`Día ${day.date.substring(8)}: $${day.sales.toFixed(2)}`}</title>
                              </g>
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              )}
              
              <div className="flex justify-center items-center gap-6 mt-4 text-[10px] font-bold text-neutral">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block" /> Ventas</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-primary/40 rounded-full inline-block" /> Compras (Inversión)</span>
              </div>
            </Card>

            {/* Daily breakdown Table */}
            <Card className="border border-border-card bg-bg-card rounded-2xl shadow-sm p-6 flex flex-col max-h-[300px]">
              <h3 className="text-sm font-bold text-secondary mb-3">Detalle Diario</h3>
              
              <div className="overflow-y-auto flex-1 no-scrollbar pr-1">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="text-neutral border-b border-border-card font-bold">
                      <th className="pb-2">Fecha</th>
                      <th className="pb-2 text-right">Ventas</th>
                      <th className="pb-2 text-right">Compras</th>
                      <th className="pb-2 text-right">Gastos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-card/50">
                    {breakdown.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-neutral text-xs">No hay datos en el rango.</td>
                      </tr>
                    ) : (
                      breakdown.map((day) => (
                        <tr key={day.date} className="text-secondary font-medium">
                          <td className="py-2.5 font-mono">{day.date.substring(5)}</td>
                          <td className="py-2.5 text-right text-emerald-600">${day.sales.toFixed(2)}</td>
                          <td className="py-2.5 text-right">${day.purchases.toFixed(2)}</td>
                          <td className="py-2.5 text-right text-amber-500">${day.expenses.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>
        </>
      )}

    </div>
  );
};

export default ReportsView;
