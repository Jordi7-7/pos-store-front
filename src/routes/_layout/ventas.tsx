import { guardRoute } from '@/modules/auth/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { SalesView } from '@/modules/sales/presentation/components/SalesView';

export const Route = createFileRoute('/_layout/ventas')({
  beforeLoad: () => guardRoute('/ventas'),
  component: SalesRoute,
});

function SalesRoute() {
  return <SalesView />;
}
