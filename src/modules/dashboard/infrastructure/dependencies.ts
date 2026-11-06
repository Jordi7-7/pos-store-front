import { SaveTenantSettings } from '../application/use-cases/save-tenant-settings';
import { DashboardHttpRepository } from './repositories/dashboard.http-repository';
import { TenantSettingsHttpRepository } from './repositories/tenant-settings.http-repository';

/** Raíz de composición del módulo. */
export const dashboardRepository = new DashboardHttpRepository();
export const tenantSettingsRepository = new TenantSettingsHttpRepository();
export const saveTenantSettings = new SaveTenantSettings(tenantSettingsRepository);
