import { guardRoute } from '@/modules/auth/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { POSView } from '@/modules/sales/presentation/components/POSView';

export const Route = createFileRoute('/_layout/pos')({
  beforeLoad: () => guardRoute('/pos'),
  component: POSRoute,
});

function POSRoute() {
  return <POSView />;
}
