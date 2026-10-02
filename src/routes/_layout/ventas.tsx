import { createFileRoute } from '@tanstack/react-router';
import { SalesView } from '@/modules/sales/components/SalesView';

export const Route = createFileRoute('/_layout/ventas')({
  component: SalesRoute,
});

function SalesRoute() {
  return <SalesView />;
}
