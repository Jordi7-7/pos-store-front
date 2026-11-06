import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenantId } from '@/modules/auth/presentation/hooks/useSession';
import { catalogRepository } from '../../infrastructure/dependencies';

export const useCategories = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const categoriesQuery = useQuery({ queryKey: ['categories', tenantId], queryFn: () => catalogRepository.listCategories() });
  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => catalogRepository.createCategory(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories', tenantId] }),
  });

  return {
    categories: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading,
    isError: categoriesQuery.isError,
    createCategory: createCategoryMutation.mutateAsync,
    isCreating: createCategoryMutation.isPending,
  };
};
export default useCategories;
