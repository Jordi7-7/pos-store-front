import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '../services/category.service';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export const useCategories = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const categoriesQuery = useQuery({
    queryKey: ['categories', tenantId],
    queryFn: () => categoryService.getCategories(),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => categoryService.createCategory(name),
    onSuccess: () => {
      // Invalidate and refetch categories cache
      queryClient.invalidateQueries({ queryKey: ['categories', tenantId] });
    },
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
