import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { InventoryTransferPage } from '@/modules/products';

export const Route = createFileRoute('/_layout/inventario/traslado')({
  beforeLoad: () => guardRoute('/inventario/traslado'),
  component: InventoryTransferPage,
});
