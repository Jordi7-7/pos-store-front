import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

export const useAttributes = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuthStore();

  const attributesQuery = useQuery({
    queryKey: ['product-attributes', tenantId],
    queryFn: () => productsService.getAttributes(),
  });

  const createAttributeMutation = useMutation({
    mutationFn: (name: string) => productsService.createAttribute(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-attributes', tenantId] });
    },
  });

  const createAttributeValueMutation = useMutation({
    mutationFn: ({ attributeId, value }: { attributeId: string; value: string }) => 
      productsService.createAttributeValue(attributeId, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-attributes', tenantId] });
    },
  });

  return {
    attributes: attributesQuery.data || [],
    isLoading: attributesQuery.isLoading,
    isError: attributesQuery.isError,
    createAttribute: createAttributeMutation.mutateAsync,
    isCreatingAttribute: createAttributeMutation.isPending,
    createAttributeValue: createAttributeValueMutation.mutateAsync,
    isCreatingValue: createAttributeValueMutation.isPending,
  };
};

export default useAttributes;
