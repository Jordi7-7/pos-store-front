import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { ProductSalesTab } from '@/modules/reports/presentation/components/ProductSalesTab';
import { useLayoutContext } from '@/providers/LayoutContext';
import { PageHeader } from '@/shared/presentation/components/PageHeader';

export const Route = createFileRoute('/_layout/reportes/ventas-productos')({
  beforeLoad: () => guardRoute('/reportes/ventas-productos'),
  component: ProductSalesRoute,
});

function ProductSalesRoute() {
  const { selectedBranchId } = useLayoutContext();
  return (
    <>
      <PageHeader title="Ventas por producto" description="Unidades vendidas por producto, existencias actuales y total recaudado." />
      <ProductSalesTab selectedBranchId={selectedBranchId || undefined} />
    </>
  );
}
