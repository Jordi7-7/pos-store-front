import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { InventoryEntryPage } from '@/modules/products';

export const Route = createFileRoute('/_layout/inventario/entrada')({
  beforeLoad: () => guardRoute('/inventario/entrada'),
  component: InventoryEntryPage,
});
