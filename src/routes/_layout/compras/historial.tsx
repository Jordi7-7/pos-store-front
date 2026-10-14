import { createFileRoute } from '@tanstack/react-router';
import { PurchaseHistory } from '@/modules/purchases/components/PurchaseHistory';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/compras/historial')({
  component: PurchasesHistoryRoute,
});

function PurchasesHistoryRoute() {
  const { selectedBranchId } = useLayoutContext();
  return <PurchaseHistory selectedBranchId={selectedBranchId || undefined} />;
}
