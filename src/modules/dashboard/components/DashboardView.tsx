import React from 'react';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { TodaySalesCard } from './TodaySalesCard';
import { PaymentMethodsCard } from './PaymentMethodsCard';
import { TopProductsCard } from './TopProductsCard';
import { LowStockCard } from './LowStockCard';
import { YesterdaySoldCard } from './YesterdaySoldCard';
import { WeeklySummaryCard } from './WeeklySummaryCard';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface DashboardViewProps {
  branchId?: string | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ branchId }) => {
  const { data: metrics, isLoading, isError, refetch, isFetching } = useDashboardMetrics(branchId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-border-card/50 rounded-lg animate-pulse" />
          <div className="h-8 w-24 bg-border-card/50 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-border-card/40 rounded-2xl animate-pulse" />
          <div className="h-64 bg-border-card/40 rounded-2xl animate-pulse" />
          <div className="h-64 bg-border-card/40 rounded-2xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-border-card/40 rounded-2xl animate-pulse" />
          <div className="h-72 bg-border-card/40 rounded-2xl animate-pulse" />
        </div>
        <div className="h-80 bg-border-card/40 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <div className="p-8 rounded-2xl border border-red-500/20 bg-red-500/5 text-center flex flex-col items-center justify-center space-y-4 my-8">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <div>
          <h3 className="text-base font-bold text-secondary">Error al cargar las métricas</h3>
          <p className="text-xs text-neutral mt-1">Ocurrió un problema obteniendo los datos del dashboard.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 text-xs font-semibold bg-primary text-white rounded-xl hover:opacity-90 transition-opacity"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Top Header / Actions - Compact bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-secondary tracking-tight">Dashboard General</h2>
          <p className="text-[11px] text-neutral">Resumen en tiempo real del rendimiento de tu negocio</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-border-card bg-bg-card hover:bg-bg-dark text-xs font-medium text-secondary transition-colors disabled:opacity-50"
          title="Actualizar datos"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-primary' : 'text-neutral'}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Row 1: Ventas Hoy (3 cols) + Métodos de Pago (4 cols) + Resumen de la Semana (5 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-stretch">
        <div className="lg:col-span-3">
          <TodaySalesCard
            totalSales={metrics.today?.totalSales || 0}
            itemsCount={metrics.today?.itemsCount || 0}
          />
        </div>
        <div className="lg:col-span-4">
          <PaymentMethodsCard data={metrics.paymentMethods} />
        </div>
        <div className="lg:col-span-5 md:col-span-2">
          <WeeklySummaryCard data={metrics.weekSummary} />
        </div>
      </div>

      {/* Row 2: Top Productos (4 cols) + Poco Inventario (4 cols) + Vendidos Ayer (4 cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
        <div className="h-[270px] xl:h-[300px]">
          <TopProductsCard products={metrics.topProducts} />
        </div>
        <div className="h-[270px] xl:h-[300px]">
          <LowStockCard products={metrics.lowStockProducts} />
        </div>
        <div className="h-[270px] xl:h-[300px]">
          <YesterdaySoldCard products={metrics.yesterdaySoldProducts} />
        </div>
      </div>
    </div>
  );
};
