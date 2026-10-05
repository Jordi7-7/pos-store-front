import { createFileRoute } from '@tanstack/react-router';
import { CostSalesTab } from '@/modules/reports/components/CostSalesTab';

export const Route = createFileRoute('/_layout/reportes/costo-ventas')({
  component: CostSalesRoute,
});

function CostSalesRoute() {
  return <CostSalesTab />;
}
