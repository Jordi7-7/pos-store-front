import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore, LoginScreen, SystemRole } from '@/modules/auth';

export const Route = createFileRoute('/login/$tenantSlug')({
  beforeLoad: async ({ params }) => {
    const targetSlug = params.tenantSlug.toLowerCase().trim();
    const { publicTenant, isAuthenticated, user, role, logout, fetchPublicTenant } = useAuthStore.getState();
    const cachedSlug = publicTenant?.slug?.toLowerCase().trim();

    // 1. Si la tienda en caché no coincide con la de la URL (o no hay caché):
    if (cachedSlug !== targetSlug) {
      if (isAuthenticated) {
        logout(); // Cierra sesión si venía de otra tienda
      }
      await fetchPublicTenant(targetSlug); // Petición única (se guarda en caché)
      return;
    }

    // 2. Si la tienda de la URL es la MISMA que ya está en caché y ya tiene sesión:
    if (isAuthenticated && user) {
      const isOwner = role === SystemRole.OWNER;
      throw redirect({
        to: isOwner ? '/dashboard' : '/pos',
      });
    }
  },
  component: () => <LoginScreen />,
});


