import { useQuery } from '@tanstack/react-query';
import { salesService } from '../services/sales.service';
import type { SaleDetailDTO } from '../types/sales.types';
import { toSaleDetailEntity } from '../mappers/sale.mapper';
import type { SaleDetailEntity } from '../entities/sale.entity';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export interface UseSaleByInvoiceReturn {
  sale: SaleDetailEntity | undefined;
  isLoading: boolean;
  isError: boolean;
  fetchSale: (invoice: string) => Promise<SaleDetailEntity>;
}

export const useSaleByInvoice = (invoiceNumber?: string, enabled = true): UseSaleByInvoiceReturn => {
  const { tenantId, isAuthenticated } = useAuthStore();

  const saleQuery = useQuery<SaleDetailDTO, Error, SaleDetailEntity>({
    queryKey: ['sale-detail', tenantId, invoiceNumber],
    queryFn: () => salesService.getSaleByInvoice(invoiceNumber!),
    select: (data) => toSaleDetailEntity(data),
    enabled: enabled && isAuthenticated && !!tenantId && !!invoiceNumber,
  });

  return {
    sale: saleQuery.data,
    isLoading: saleQuery.isLoading,
    isError: saleQuery.isError,
    fetchSale: async (invoice: string): Promise<SaleDetailEntity> => {
      const raw = await salesService.getSaleByInvoice(invoice);
      return toSaleDetailEntity(raw);
    },
  };
};
