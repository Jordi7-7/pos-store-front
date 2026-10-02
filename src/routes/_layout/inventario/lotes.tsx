import { createFileRoute } from '@tanstack/react-router';
import { ProductBatchesView } from '@/modules/products';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/inventario/lotes')({
  component: InventoryBatchesRoute,
});

function InventoryBatchesRoute() {
  const { selectedBranchId } = useLayoutContext();

  return <ProductBatchesView selectedBranchId={selectedBranchId || ''} />;
}
