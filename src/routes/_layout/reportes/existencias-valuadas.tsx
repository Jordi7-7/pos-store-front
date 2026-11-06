import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { ValuedInventoryTab } from '@/modules/reports/presentation/components/ValuedInventoryTab';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/reportes/existencias-valuadas')({
  beforeLoad: () => guardRoute('/reportes/existencias-valuadas'),
  component: ValuedInventoryRoute,
});

function ValuedInventoryRoute() {
  const { selectedBranchId } = useLayoutContext();
  return <ValuedInventoryTab selectedBranchId={selectedBranchId || undefined} />;
}
