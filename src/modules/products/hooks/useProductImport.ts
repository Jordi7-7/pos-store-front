import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import type {
  ValidateImportItemInput,
  ValidateImportResult,
  BulkImportProductsInput,
  BulkImportProductsResult,
} from '../types';

export interface UseProductImportOptions {
  onValidateSuccess?: (data: ValidateImportResult) => void;
  onValidateError?: (error: Error) => void;
  onImportSuccess?: (result: BulkImportProductsResult) => void;
  onImportError?: (error: Error) => void;
}

export const useProductImport = (options?: UseProductImportOptions) => {
  const queryClient = useQueryClient();

  const validateMutation = useMutation({
    mutationFn: (items: ValidateImportItemInput[]) => productsService.validateImport(items),
    onSuccess: (data) => {
      options?.onValidateSuccess?.(data);
    },
    onError: (err: Error) => {
      options?.onValidateError?.(err);
    },
  });

  const importMutation = useMutation({
    mutationFn: (input: BulkImportProductsInput) => productsService.importProducts(input),
    onSuccess: (res) => {
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
    validationErrors: validateMutation.data?.errors,

    importProducts: importMutation.mutate,
    importProductsAsync: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
    importResult: importMutation.data,

    resetValidation: validateMutation.reset,
    resetImport: importMutation.reset,
  };
};
