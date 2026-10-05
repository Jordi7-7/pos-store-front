import { createFileRoute } from '@tanstack/react-router';
import { ProductSalesTab } from '@/modules/reports/components/ProductSalesTab';

export const Route = createFileRoute('/_layout/reportes/ventas-productos')({
  component: ProductSalesRoute,
});

function ProductSalesRoute() {
  return <ProductSalesTab />;
}
