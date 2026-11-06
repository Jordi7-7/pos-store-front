import { useMutation, useQueryClient } from '@tanstack/react-query';
import { salesRepository } from '../../infrastructure/dependencies';
import type { RegisterExpenseInput, ProcessRefundInput } from '../../application/ports/sales.repository';
import type { CheckoutCommand } from '../../application/checkout';
import { checkout } from '../../infrastructure/dependencies';
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

export const useRegisterExpense = () => {
  const queryClient = useQueryClient();

  const expenseMutation = useMutation({
    mutationFn: (input: RegisterExpenseInput) => salesRepository.registerExpense(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-session-details'] });
    },
  });

  return {
    registerExpense: expenseMutation.mutateAsync,
    isRegistering: expenseMutation.isPending,
  };
};


export const useProcessRefund = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const processRefundMutation = useMutation({
    mutationFn: (input: ProcessRefundInput) => salesRepository.processRefund(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantId] }); // restore stock
      queryClient.invalidateQueries({ queryKey: ['cash-session-details'] });
    },
  });

  return {
    processRefund: processRefundMutation.mutateAsync,
    isProcessing: processRefundMutation.isPending,
  };
};

