import { guardRoute } from '@/modules/auth/hooks/route-guard';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ProductCreateVariableView } from '@/modules/products';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/inventario/crear-compuesto')({
  beforeLoad: () => guardRoute('/inventario/crear-compuesto'),
  component: InventoryCreateVariableRoute,
});

function InventoryCreateVariableRoute() {
  const navigate = useNavigate();
  const { selectedBranchId } = useLayoutContext();

  return (
    <ProductCreateVariableView
      selectedBranchId={selectedBranchId || ''}
      onSuccess={() => {
        navigate({
          to: '/inventario/productos',
        });
      }}
    />
  );
}
