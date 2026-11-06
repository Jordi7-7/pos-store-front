import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { DashboardView } from '@/modules/dashboard/components/DashboardView';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/dashboard')({
  beforeLoad: () => guardRoute('/dashboard'),
  component: DashboardRoute,
});

function DashboardRoute() {
  const { selectedBranchId } = useLayoutContext();

  return <DashboardView branchId={selectedBranchId} />;
}
