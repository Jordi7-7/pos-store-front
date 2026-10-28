import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore, LoginScreen, SystemRole } from '@/modules/auth';

export const Route = createFileRoute('/login/')({
  beforeLoad: () => {
    const { isAuthenticated, user, role } = useAuthStore.getState();
    if (isAuthenticated && user) {
      const isOwner = role === SystemRole.OWNER;
      throw redirect({
        to: isOwner ? '/dashboard' : '/pos',
      });
    }
  },
  component: () => <LoginScreen />,
});

