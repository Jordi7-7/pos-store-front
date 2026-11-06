import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { CustomersView } from '@/modules/customers';
import { PageHeader } from '@/shared/presentation/components/PageHeader';

export const Route = createFileRoute('/_layout/clientes')({
  beforeLoad: () => guardRoute('/clientes'),
  component: CustomersRoute,
});

function CustomersRoute() {
  return (
    <>
      <PageHeader title="Clientes" description="Administra tus clientes frecuentes para ventas y reportes." />
      <CustomersView />
    </>
  );
}
