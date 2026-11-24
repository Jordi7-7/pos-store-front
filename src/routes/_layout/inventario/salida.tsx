import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { InventoryExitPage } from '@/modules/products';

export const Route = createFileRoute('/_layout/inventario/salida')({
  beforeLoad: () => guardRoute('/inventario/salida'),
  component: InventoryExitPage,
});
