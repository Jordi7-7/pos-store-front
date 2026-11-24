import { useQueryClient } from '@tanstack/react-query';
import { useTenantId } from '@/modules/auth/presentation/hooks/useSession';

/** Lo que muestra existencias o movimientos y deja de ser cierto cuando se registra un documento de inventario. */
const INVENTORY_QUERY_KEYS = ['inventory-movements', 'products', 'batches', 'variant-movements', 'product-detail'] as const;

/** Devuelve una función que refresca todas las consultas afectadas por un documento de inventario (entrada, salida, conteo o traslado). */
export function useInvalidateInventory(): () => void {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  return () => {
    for (const key of INVENTORY_QUERY_KEYS) queryClient.invalidateQueries({ queryKey: [key, tenantId] });
  };
}
