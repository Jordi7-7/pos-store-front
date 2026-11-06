import { guardRoute } from '@/modules/auth/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { CashSessionsHistoryView } from '@/modules/cash-sessions/components/CashSessionsHistoryView';

export const Route = createFileRoute('/_layout/cajas/historial')({
  beforeLoad: () => guardRoute('/cajas/historial'),
  component: CashSessionsRoute,
});

function CashSessionsRoute() {
  return <CashSessionsHistoryView />;
}
