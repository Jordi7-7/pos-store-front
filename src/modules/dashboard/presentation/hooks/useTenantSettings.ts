import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/modules/auth/presentation/stores/useAuthStore';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import { saveTenantSettings, tenantSettingsRepository } from '../../infrastructure/dependencies';
import type { SaveTenantSettingsCommand } from '../../application/use-cases/save-tenant-settings';
import type { TenantMetadata, TenantSettings } from '../../domain/entities/tenant-settings.entity';

/** Carga las opciones y la configuración actual del negocio y permite guardarla (re-sincronizando la sesión). */
export function useTenantSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [metadata, setMetadata] = useState<TenantMetadata | null>(null);
  const [settings, setSettings] = useState<TenantSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [options, current] = await Promise.all([tenantSettingsRepository.metadata(), tenantSettingsRepository.current()]);
        if (cancelled) return;
        setMetadata(options);
        setSettings(current);
      } catch (error) {
        console.error('Error loading tenant settings:', error);
        toast.error('Error al cargar la configuración del negocio');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (command: SaveTenantSettingsCommand): Promise<boolean> => {
    try {
      setIsSaving(true);
      await saveTenantSettings.execute(command);
      // Re-sincroniza la tienda de la sesión (nombre, slug, logo, país, moneda, zona horaria) con el servidor.
      await useAuthStore.getState().fetchProfile();
      toast.success('Configuración del negocio y logo actualizados con éxito');
      return true;
    } catch (error) {
      console.error('Error updating tenant:', error);
      toast.error(getErrorMessage(error, 'Error al guardar la configuración'));
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { isLoading, isSaving, metadata, settings, save };
}
