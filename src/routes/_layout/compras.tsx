import { createFileRoute } from '@tanstack/react-router';
import { PurchasesView } from '@/modules/purchases/components/PurchasesView';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/compras')({
  component: PurchasesRoute,
});

function PurchasesRoute() {
  const { selectedBranchId } = useLayoutContext();
  return <PurchasesView selectedBranchId={selectedBranchId || ''} />;
}
