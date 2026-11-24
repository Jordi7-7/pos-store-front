import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { StockCountPage } from '@/modules/products';

export const Route = createFileRoute('/_layout/inventario/conteo')({
  beforeLoad: () => guardRoute('/inventario/conteo'),
  component: StockCountPage,
});
