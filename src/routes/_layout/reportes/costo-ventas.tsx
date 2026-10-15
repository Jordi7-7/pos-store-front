import { createFileRoute } from '@tanstack/react-router';
import { CostSalesTab } from '@/modules/reports/components/CostSalesTab';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/reportes/costo-ventas')({
  component: CostSalesRoute,
});

function CostSalesRoute() {
  const { selectedBranchId } = useLayoutContext();
  return <CostSalesTab selectedBranchId={selectedBranchId || undefined} />;
}
