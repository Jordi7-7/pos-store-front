import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { CostSalesTab } from '@/modules/reports/presentation/components/CostSalesTab';
import { useLayoutContext } from '@/providers/LayoutContext';
import { PageHeader } from '@/shared/presentation/components/PageHeader';

export const Route = createFileRoute('/_layout/reportes/costo-ventas')({
  beforeLoad: () => guardRoute('/reportes/costo-ventas'),
  component: CostSalesRoute,
});

function CostSalesRoute() {
  const { selectedBranchId } = useLayoutContext();
  return (
    <>
      <PageHeader title="Costo de ventas" description="Rentabilidad por documento: el costo de lo vendido frente al precio final." />
      <CostSalesTab selectedBranchId={selectedBranchId || undefined} />
    </>
  );
}
