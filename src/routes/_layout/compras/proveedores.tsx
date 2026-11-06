import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { SuppliersView } from '@/modules/purchases/components/SuppliersView';

export const Route = createFileRoute('/_layout/compras/proveedores')({
  beforeLoad: () => guardRoute('/compras/proveedores'),
  component: SuppliersRoute,
});

function SuppliersRoute() {
  return <SuppliersView />;
}
