import { guardRoute } from '@/modules/auth/hooks/route-guard';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ProductCreateView } from '@/modules/products';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/inventario/crear')({
  beforeLoad: () => guardRoute('/inventario/crear'),
  component: InventoryCreateRoute,
});

function InventoryCreateRoute() {
  const navigate = useNavigate();
  const { selectedBranchId } = useLayoutContext();

  return (
    <ProductCreateView
      selectedBranchId={selectedBranchId || ''}
      onSuccess={() => {
        navigate({
          to: '/inventario/productos',
        });
      }}
    />
  );
}
