import { guardRoute } from '@/modules/auth/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router'
import { UsersView } from '@/modules/users/views/UsersView';

export const Route = createFileRoute('/_layout/usuarios')({
  beforeLoad: () => guardRoute('/usuarios'),
  component: UsersRoute,
});

function UsersRoute() {
  return <UsersView />;
}
