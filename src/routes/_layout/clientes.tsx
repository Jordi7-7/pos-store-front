import { createFileRoute } from '@tanstack/react-router';
import { CustomersView } from '@/modules/customers/components/CustomersView';

export const Route = createFileRoute('/_layout/clientes')({
  component: CustomersRoute,
});

function CustomersRoute() {
  return <CustomersView />;
}
