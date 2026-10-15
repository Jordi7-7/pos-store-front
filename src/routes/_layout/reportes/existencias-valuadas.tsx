import { createFileRoute } from '@tanstack/react-router';
import { ValuedInventoryTab } from '@/modules/reports/components/ValuedInventoryTab';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/reportes/existencias-valuadas')({
  component: ValuedInventoryRoute,
});

function ValuedInventoryRoute() {
  const { selectedBranchId } = useLayoutContext();
  return <ValuedInventoryTab selectedBranchId={selectedBranchId || undefined} />;
}
