import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PurchaseForm } from '@/modules/purchases/presentation/components/PurchaseForm';
import { useLayoutContext } from '@/providers/LayoutContext';
import { PageHeader } from '@/shared/presentation/components/PageHeader';

export const Route = createFileRoute('/_layout/compras/registrar')({
  beforeLoad: () => guardRoute('/compras/registrar'),
  component: PurchasesRegisterRoute,
});

function PurchasesRegisterRoute() {
  const { selectedBranchId } = useLayoutContext();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Registrar compra" description="Ingresa mercancía al inventario indicando el SKU de cada producto." />
      <PurchaseForm
        selectedBranchId={selectedBranchId || ''}
        onSuccess={() => navigate({ to: '/compras/historial' })}
      />
    </>
  );
}
