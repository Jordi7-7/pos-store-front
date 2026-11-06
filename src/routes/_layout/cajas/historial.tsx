import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { CashSessionsHistoryView } from '@/modules/cash-sessions/presentation/components/CashSessionsHistoryView';
import { PageHeader } from '@/shared/presentation/components/PageHeader';

export const Route = createFileRoute('/_layout/cajas/historial')({
  beforeLoad: () => guardRoute('/cajas/historial'),
  component: CashSessionsRoute,
});

function CashSessionsRoute() {
  return (
    <>
      <PageHeader title="Historial de turnos" description="Aperturas, ventas facturadas y arqueos de cierre por caja." />
      <CashSessionsHistoryView />
    </>
  );
}
