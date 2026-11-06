import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { CustomersView } from '@/modules/customers';

export const Route = createFileRoute('/_layout/clientes')({
  beforeLoad: () => guardRoute('/clientes'),
  component: CustomersRoute,
});

function CustomersRoute() {
  return <CustomersView />;
}
