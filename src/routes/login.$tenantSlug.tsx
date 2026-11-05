import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore, selectIsAuthenticated, homeRouteFor, LoginScreen } from '@/modules/auth';

export const Route = createFileRoute('/login/$tenantSlug')({
  beforeLoad: async ({ params }) => {
    const targetSlug = params.tenantSlug.toLowerCase().trim();
    const { tenant, logout, fetchPublicTenant } = useAuthStore.getState();
    const cachedSlug = tenant?.slug.toLowerCase().trim();

    // 1. Si la tienda en caché no coincide con la de la URL (o no hay caché):
    if (cachedSlug !== targetSlug) {
      if (selectIsAuthenticated(useAuthStore.getState())) {
        logout(); // Cierra sesión si venía de otra tienda
      }
      await fetchPublicTenant(targetSlug); // Petición única (se guarda en caché)
      return;
    }

    // 2. Si la tienda de la URL es la MISMA que ya está en caché y ya tiene sesión:
    const state = useAuthStore.getState();
    if (selectIsAuthenticated(state)) {
      throw redirect({ to: homeRouteFor(state.user) });
    }
  },
  component: () => <LoginScreen />,
});


