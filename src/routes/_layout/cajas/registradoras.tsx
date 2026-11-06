import { guardRoute } from '@/modules/auth/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { CashRegistersView } from '@/modules/cash-registers/presentation/components/CashRegistersView';

export const Route = createFileRoute('/_layout/cajas/registradoras')({
  beforeLoad: () => guardRoute('/cajas/registradoras'),
  component: CashRegistersRoute,
});

function CashRegistersRoute() {
  return <CashRegistersView />;
}
