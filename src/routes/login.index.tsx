import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore, selectIsAuthenticated, homeRouteFor, LoginScreen } from '@/modules/auth';

export const Route = createFileRoute('/login/')({
  beforeLoad: () => {
    const state = useAuthStore.getState();
    if (selectIsAuthenticated(state)) {
      throw redirect({ to: homeRouteFor(state.user) });
    }
  },
  component: () => <LoginScreen />,
});

