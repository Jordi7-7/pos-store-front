import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatters } from '@/modules/auth/presentation/hooks/useFormatters';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/presentation/hooks/useSession';
import { inventoryRepository } from '../../infrastructure/dependencies';
import { toInventoryDocumentDetailVM } from '../view-models/inventory.vm';

/** Un documento de inventario con todas sus líneas; no consulta nada mientras `documentId` sea `null` (ventana cerrada). */
export const useInventoryDocument = (documentId: string | null) => {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();
  const fmt = useFormatters();

  const query = useQuery({
    queryKey: ['inventory-documents', tenantId, documentId],
    queryFn: () => inventoryRepository.getDocument(documentId ?? ''),
    enabled: isAuthenticated && !!tenantId && !!documentId,
  });

  const entity = query.data;
  const document = useMemo(() => (entity ? toInventoryDocumentDetailVM(entity, fmt) : undefined), [entity, fmt]);

  return { document, isLoading: query.isLoading, isError: query.isError, error: query.error };
};
