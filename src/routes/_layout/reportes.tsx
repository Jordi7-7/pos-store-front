import { createFileRoute } from '@tanstack/react-router';
import { ReportsView } from '@/modules/reports/components/ReportsView';

export const Route = createFileRoute('/_layout/reportes')({
  component: ReportsRoute,
});

function ReportsRoute() {
  return <ReportsView />;
}
