import { createFileRoute } from '@tanstack/react-router';
import { TenantSettings } from '@/modules/dashboard/components/TenantSettings';

export const Route = createFileRoute('/_layout/configuracion')({
  component: SettingsRoute,
});

function SettingsRoute() {
  return <TenantSettings />;
}
