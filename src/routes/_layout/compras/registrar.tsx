import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { PurchaseForm } from '@/modules/purchases/components/PurchaseForm';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/compras/registrar')({
  component: PurchasesRegisterRoute,
});

function PurchasesRegisterRoute() {
  const { selectedBranchId } = useLayoutContext();
  const navigate = useNavigate();

  return (
    <PurchaseForm
      selectedBranchId={selectedBranchId || ''}
      onSuccess={() => navigate({ to: '/compras/historial' })}
    />
  );
}
