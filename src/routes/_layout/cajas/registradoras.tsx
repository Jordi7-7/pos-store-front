import { createFileRoute } from '@tanstack/react-router';
import { CashRegistersView } from '@/modules/cash-registers/components/CashRegistersView';

export const Route = createFileRoute('/_layout/cajas/registradoras')({
  component: CashRegistersRoute,
});

function CashRegistersRoute() {
  return <CashRegistersView />;
}
