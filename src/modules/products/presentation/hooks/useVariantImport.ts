import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productsRepository } from '../../infrastructure/dependencies';
import type { ImportVariantsInput, ImportVariantsReport } from '../../application/ports/products.repository';
import { useTenantId } from '@/modules/auth/presentation/hooks/useSession';

/** Importación de productos con variantes: `validate` solo revisa el archivo (no escribe) e `importNow` lo guarda todo o nada. */
export const useVariantImport = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const validateMutation = useMutation<ImportVariantsReport, Error, Omit<ImportVariantsInput, 'dryRun'>>({
    mutationFn: (input) => productsRepository.importVariants({ ...input, dryRun: true }),
  });

  const importMutation = useMutation<ImportVariantsReport, Error, Omit<ImportVariantsInput, 'dryRun'>>({
    mutationFn: (input) => productsRepository.importVariants({ ...input, dryRun: false }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['product-attributes', tenantId] });
      void queryClient.invalidateQueries({ queryKey: ['categories', tenantId] });
    },
  });

  return {
    validate: validateMutation.mutateAsync,
    isValidating: validateMutation.isPending,
    importNow: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
    reset: () => {
      validateMutation.reset();
      importMutation.reset();
    },
  };
};
