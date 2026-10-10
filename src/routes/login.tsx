import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuthStore, LoginScreen, SystemRole } from '@/modules/auth';
import { useEffect } from 'react';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const { isAuthenticated, user, role } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const isOwner = role === SystemRole.OWNER;
      navigate({
        to: isOwner ? '/dashboard' : '/pos',
        replace: true,
      });
    }
  }, [isAuthenticated, user, role, navigate]);

  return <LoginScreen />;
}
