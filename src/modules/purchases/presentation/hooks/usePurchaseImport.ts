import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesRepository } from '../../infrastructure/dependencies';
import type { BulkImportInput, ImportValidation, ImportValidationItem } from '../../application/ports/purchases.repository';
import type { PurchaseEntity } from '../../domain/entities/purchase.entity';

export interface UsePurchaseImportOptions {
  onValidateSuccess?: (data: ImportValidation) => void;
  onValidateError?: (error: Error) => void;
  onImportSuccess?: (result: PurchaseEntity) => void;
  onImportError?: (error: Error) => void;
}

export const usePurchaseImport = (options?: UsePurchaseImportOptions) => {
  const queryClient = useQueryClient();

  const validateMutation = useMutation({
    mutationFn: (items: ImportValidationItem[]) =>
      purchasesRepository.validateImport(items),
    onSuccess: (data) => {
      options?.onValidateSuccess?.(data);
    },
    onError: (err: Error) => {
      options?.onValidateError?.(err);
    },
  });

  const importMutation = useMutation({
    mutationFn: (input: BulkImportInput) =>
      purchasesRepository.import(input),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      options?.onImportSuccess?.(res);
    },
    onError: (err: Error) => {
      options?.onImportError?.(err);
    },
  });

  return {
    validateImport: validateMutation.mutate,
    validateImportAsync: validateMutation.mutateAsync,
    isValidating: validateMutation.isPending,
    validationData: validateMutation.data,

    importPurchases: importMutation.mutate,
    importPurchasesAsync: importMutation.mutateAsync,
    isImporting: importMutation.isPending,

    resetValidation: validateMutation.reset,
    resetImport: importMutation.reset,
  };
};
