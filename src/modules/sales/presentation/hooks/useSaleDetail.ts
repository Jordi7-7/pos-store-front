import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatters } from '@/modules/auth/hooks/useFormatters';
import { toSaleDetailVM, type SaleDetailVM } from '../view-models/sale.vm';
import { salesService } from '../../infrastructure/sales.service';
import type { SaleDetailDTO } from '../../infrastructure/dtos/sales.dto';
import { toSaleDetailEntity } from '../../infrastructure/mappers/sale.mapper';
import type { SaleDetailEntity } from '../../domain/entities/sale.entity';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/hooks/useSession';

export interface UseSaleByInvoiceReturn {
  sale: SaleDetailVM | undefined;
  isLoading: boolean;
  isError: boolean;
  fetchSale: (invoice: string) => Promise<SaleDetailEntity>;
}

export const useSaleByInvoice = (invoiceNumber?: string, enabled = true): UseSaleByInvoiceReturn => {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();
  const fmt = useFormatters();

  const saleQuery = useQuery<SaleDetailDTO, Error, SaleDetailEntity>({
    queryKey: ['sale-detail', tenantId, invoiceNumber],
    queryFn: () => salesService.getSaleByInvoice(invoiceNumber!),
    select: (data) => toSaleDetailEntity(data),
    enabled: enabled && isAuthenticated && !!tenantId && !!invoiceNumber,
  });

  const entity = saleQuery.data;
  const sale = useMemo(() => (entity ? toSaleDetailVM(entity, fmt) : undefined), [entity, fmt]);

  return {
    sale,
    isLoading: saleQuery.isLoading,
    isError: saleQuery.isError,
    fetchSale: async (invoice: string): Promise<SaleDetailEntity> => {
      const raw = await salesService.getSaleByInvoice(invoice);
      return toSaleDetailEntity(raw);
    },
  };
};
