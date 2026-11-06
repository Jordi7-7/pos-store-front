import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenantId } from '@/modules/auth/presentation/hooks/useSession';
import { catalogRepository } from '../../infrastructure/dependencies';
import type { AttributeEntity } from '../../domain/entities/catalog.entity';

export const useAttributes = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['product-attributes', tenantId] });

  const attributesQuery = useQuery<AttributeEntity[]>({
    queryKey: ['product-attributes', tenantId],
    queryFn: () => catalogRepository.listAttributes(),
  });
  const createAttributeMutation = useMutation({ mutationFn: (name: string) => catalogRepository.createAttribute(name), onSuccess: refresh });
  const createAttributeValueMutation = useMutation({
    mutationFn: ({ attributeId, value }: { attributeId: string; value: string }) => catalogRepository.createAttributeValue(attributeId, value),
    onSuccess: refresh,
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
