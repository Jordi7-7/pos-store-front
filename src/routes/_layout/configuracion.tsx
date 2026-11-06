import { guardRoute } from '@/modules/auth/presentation/hooks/route-guard';
import { createFileRoute } from '@tanstack/react-router';
import { TenantSettings } from '@/modules/dashboard/presentation/components/TenantSettings';

export const Route = createFileRoute('/_layout/configuracion')({
  beforeLoad: () => guardRoute('/configuracion'),
  component: SettingsRoute,
});

function SettingsRoute() {
  return <TenantSettings />;
}
