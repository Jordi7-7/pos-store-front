import { createFileRoute } from '@tanstack/react-router';
import { DashboardView } from '@/modules/dashboard/components/DashboardView';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import { useLayoutContext } from '@/providers/LayoutContext';

export const Route = createFileRoute('/_layout/dashboard')({
  component: DashboardRoute,
});

function DashboardRoute() {
  const { user } = useAuthStore();
  const { sales, suppliers } = useLayoutContext();

  return (
    <DashboardView
      user={user}
      sales={sales}
      suppliers={suppliers}
    />
  );
}
