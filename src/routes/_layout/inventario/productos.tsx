import { createFileRoute } from '@tanstack/react-router';
import { ProductsListView } from '@/modules/products';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/inventario/productos')({
  component: InventoryProductsRoute,
});

function InventoryProductsRoute() {
  const { selectedBranchId } = useLayoutContext();

  return (
    <ProductsListView
      selectedBranchId={selectedBranchId || ''}
    />
  );
}
