import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { SuppliersView } from '@/modules/purchases/presentation/components/SuppliersView';
import { PageHeader } from '@/shared/presentation/components/PageHeader';

export const Route = createFileRoute('/_layout/compras/proveedores')({
  beforeLoad: () => guardRoute('/compras/proveedores'),
  component: SuppliersRoute,
});

function SuppliersRoute() {
  return (
    <>
      <PageHeader title="Proveedores" description="Directorio de proveedores para tus compras." />
      <SuppliersView />
    </>
  );
}
