import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { ProductMovementsPage } from '@/modules/products';

export const Route = createFileRoute('/_layout/inventario/movimientos')({
  beforeLoad: () => guardRoute('/inventario/movimientos'),
  component: ProductMovementsPage,
});
