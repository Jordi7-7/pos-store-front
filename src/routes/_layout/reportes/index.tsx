import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_layout/reportes/')({
  beforeLoad: () => {
    throw redirect({
      to: '/reportes/costo-ventas',
    });
  },
});
