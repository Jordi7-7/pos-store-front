import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CheckoutCommand } from '../../application/checkout';
import { checkout, exchangeProducts, refundSale } from '../../infrastructure/dependencies';
import type { ExchangeCommand } from '../../application/exchange-products';
import type { RefundSaleCommand } from '../../application/refund-sale';
import { useTenantId } from '@/modules/auth/hooks/useSession';

export const useProcessSale = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const processSaleMutation = useMutation({
    mutationFn: (command: CheckoutCommand) => checkout.execute(command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] }); // update stock
      queryClient.invalidateQueries({ queryKey: ['cash-session-details'] });
    },
  });

  return {
    processSale: processSaleMutation.mutateAsync,
    isProcessing: processSaleMutation.isPending,
  };
};

export const useRefundSale = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const mutation = useMutation({
    mutationFn: (command: RefundSaleCommand) => refundSale.execute(command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] }); // restore stock
      queryClient.invalidateQueries({ queryKey: ['cash-session-details'] });
    },
  });
  return { refundSale: mutation.mutateAsync, isRefunding: mutation.isPending };
};

export const useExchangeProducts = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const mutation = useMutation({
    mutationFn: (command: ExchangeCommand) => exchangeProducts.execute(command),
    // Aunque falle el cobro, la devolución puede haberse registrado: se refrescan stock y caja igualmente
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['cash-session-details'] });
    },
  });
  return { exchangeProducts: mutation.mutateAsync, isExchanging: mutation.isPending };
};
