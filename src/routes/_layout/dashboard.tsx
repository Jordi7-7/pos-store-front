import { createFileRoute } from '@tanstack/react-router';
import { DashboardView } from '@/modules/dashboard/components/DashboardView';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/dashboard')({
  component: DashboardRoute,
});

function DashboardRoute() {
  const { selectedBranchId } = useLayoutContext();

  return <DashboardView branchId={selectedBranchId} />;
}
