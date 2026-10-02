import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import { LoginScreen } from '@/modules/auth';
import { useEffect } from 'react';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const { isAuthenticated, user, role } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const isPosAdmin = role === 'OWNER' || role === 'ADMIN';
      navigate({
        to: isPosAdmin ? '/dashboard' : '/pos',
        replace: true,
      });
    }
  }, [isAuthenticated, user, role, navigate]);

  return <LoginScreen />;
}
