import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster richColors closeButton theme="dark" position="top-right" />
    </>
  ),
});
