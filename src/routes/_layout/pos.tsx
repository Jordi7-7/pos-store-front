import { createFileRoute } from '@tanstack/react-router';
import { POSView } from '@/modules/sales/components/POSView';

export const Route = createFileRoute('/_layout/pos')({
  component: POSRoute,
});

function POSRoute() {
  return <POSView />;
}
