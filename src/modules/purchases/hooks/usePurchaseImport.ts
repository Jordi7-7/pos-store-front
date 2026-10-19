import { useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesService } from '../services/purchases.service';
import type {
  ValidateImportPurchasesItemInput,
  ValidateImportPurchasesResult,
  BulkImportPurchasesInput,
  Purchase,
} from '../types';

export interface UsePurchaseImportOptions {
  onValidateSuccess?: (data: ValidateImportPurchasesResult) => void;
  onValidateError?: (error: Error) => void;
  onImportSuccess?: (result: Purchase) => void;
  onImportError?: (error: Error) => void;
}

export const usePurchaseImport = (options?: UsePurchaseImportOptions) => {
  const queryClient = useQueryClient();

  const validateMutation = useMutation({
    mutationFn: (items: ValidateImportPurchasesItemInput[]) =>
      purchasesService.validateImport(items),
    onSuccess: (data) => {
      options?.onValidateSuccess?.(data);
    },
    onError: (err: Error) => {
      options?.onValidateError?.(err);
    },
  });

  const importMutation = useMutation({
    mutationFn: (input: BulkImportPurchasesInput) =>
      purchasesService.importPurchases(input),
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
