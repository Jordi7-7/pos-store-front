import { createFileRoute } from '@tanstack/react-router';
import { SuppliersView } from '@/modules/purchases/components/SuppliersView';

export const Route = createFileRoute('/_layout/compras/proveedores')({
  component: SuppliersRoute,
});

function SuppliersRoute() {
  return <SuppliersView />;
}
