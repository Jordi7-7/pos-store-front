import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatters } from '@/modules/auth/presentation/hooks/useFormatters';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/presentation/hooks/useSession';
import type { PaginatedResult } from '@/shared/domain/value-objects/paginated';
import { inventoryRepository } from '../../infrastructure/dependencies';
import type { DocumentsQuery } from '../../application/ports/inventory.repository';
import { toInventoryDocumentListItemVM, type InventoryDocumentListItemVM } from '../view-models/inventory.vm';

type Meta = PaginatedResult<unknown>['meta'];

const DEFAULT_META: Meta = { total: 0, page: 1, limit: 20, totalPages: 1 };

/** Los documentos de inventario (uno por fila), con los filtros pedidos. `enabled` evita consultar mientras se ve otra pestaña. */
export const useInventoryDocuments = (params: DocumentsQuery, enabled = true) => {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();
  const fmt = useFormatters();

  const query = useQuery({
    queryKey: ['inventory-documents-list', tenantId, params],
    queryFn: () => inventoryRepository.listDocuments(params),
    enabled: enabled && isAuthenticated && !!tenantId,
  });

  const entities = query.data?.data;
  const documents: InventoryDocumentListItemVM[] = useMemo(() => (entities ?? []).map((document) => toInventoryDocumentListItemVM(document, fmt)), [entities, fmt]);

  return {
    documents,
    meta: query.data?.meta ?? DEFAULT_META,
    isLoading: query.isLoading,
    isError: query.isError,
  };
};
