import React, { useEffect } from 'react';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { useAuthStore } from './modules/auth';
import { getSavedTheme, applyTheme } from './lib/themeManager';

// Create TanStack Router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

// Register router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const App: React.FC = () => {
  const { tenantId, publicTenant } = useAuthStore();

  // Apply tenant theme on load and tenant change
  useEffect(() => {
    const theme = getSavedTheme(tenantId || publicTenant?.id);
    applyTheme(theme);
  }, [tenantId, publicTenant?.id]);

  return <RouterProvider router={router} />;
};

export default App;
