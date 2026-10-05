import { createFileRoute } from '@tanstack/react-router';
import { ValuedInventoryTab } from '@/modules/reports/components/ValuedInventoryTab';

export const Route = createFileRoute('/_layout/reportes/existencias-valuadas')({
  component: ValuedInventoryRoute,
});

function ValuedInventoryRoute() {
  return <ValuedInventoryTab />;
}
