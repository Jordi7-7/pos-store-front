import { createFileRoute } from '@tanstack/react-router';
import { ProductSalesTab } from '@/modules/reports/components/ProductSalesTab';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/reportes/ventas-productos')({
  component: ProductSalesRoute,
});

function ProductSalesRoute() {
  const { selectedBranchId } = useLayoutContext();
  return <ProductSalesTab selectedBranchId={selectedBranchId || undefined} />;
}
