import { guardRoute } from '@/modules/auth/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { PurchaseHistory } from '@/modules/purchases/components/PurchaseHistory';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/compras/historial')({
  beforeLoad: () => guardRoute('/compras/historial'),
  component: PurchasesHistoryRoute,
});

function PurchasesHistoryRoute() {
  const { selectedBranchId } = useLayoutContext();
  return <PurchaseHistory selectedBranchId={selectedBranchId || undefined} />;
}
