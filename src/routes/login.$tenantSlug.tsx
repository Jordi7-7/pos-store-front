import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useAuthStore, LoginScreen, SystemRole } from '@/modules/auth';
import { useEffect } from 'react';

export const Route = createFileRoute('/login/$tenantSlug')({
  component: TenantLoginPage,
});

function TenantLoginPage() {
  const { tenantSlug } = useParams({ from: '/login/$tenantSlug' });
  const { isAuthenticated, user, role, fetchPublicTenant, publicTenant } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (tenantSlug) {
      if (!publicTenant || publicTenant.slug !== tenantSlug.toLowerCase().trim()) {
        fetchPublicTenant(tenantSlug);
      }
    }
  }, [tenantSlug, publicTenant, fetchPublicTenant]);

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
