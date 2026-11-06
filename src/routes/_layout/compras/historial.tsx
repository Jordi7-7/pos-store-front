import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { PurchaseHistory } from '@/modules/purchases/presentation/components/PurchaseHistory';
import { useLayoutContext } from '@/providers/LayoutContext';
import { PageHeader } from '@/shared/presentation/components/PageHeader';

export const Route = createFileRoute('/_layout/compras/historial')({
  beforeLoad: () => guardRoute('/compras/historial'),
  component: PurchasesHistoryRoute,
});

function PurchasesHistoryRoute() {
  const { selectedBranchId } = useLayoutContext();
  return (
    <>
      <PageHeader title="Historial de compras" description="Ingresos de mercancía registrados, con su proveedor y total." />
      <PurchaseHistory selectedBranchId={selectedBranchId || undefined} />
    </>
  );
}
