import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { CashRegistersView } from '@/modules/cash-registers/presentation/components/CashRegistersView';
import { PageHeader } from '@/shared/presentation/components/PageHeader';

export const Route = createFileRoute('/_layout/cajas/registradoras')({
  beforeLoad: () => guardRoute('/cajas/registradoras'),
  component: CashRegistersRoute,
});

function CashRegistersRoute() {
  return (
    <>
      <PageHeader title="Cajas registradoras" description="Cajas de cada sucursal y los usuarios autorizados a operarlas." />
      <CashRegistersView />
    </>
  );
}
