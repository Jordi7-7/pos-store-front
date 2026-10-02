import { createFileRoute } from '@tanstack/react-router';
import { UsersView } from '@/modules/users/components/UsersView';

export const Route = createFileRoute('/_layout/usuarios')({
  component: UsersRoute,
});

function UsersRoute() {
  return <UsersView />;
}
