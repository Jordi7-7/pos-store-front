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

  const deleteAttributeMutation = useMutation({ mutationFn: (attributeId: string) => catalogRepository.deleteAttribute(attributeId), onSuccess: refresh });
  const deleteAttributeValueMutation = useMutation({ mutationFn: (valueId: string) => catalogRepository.deleteAttributeValue(valueId), onSuccess: refresh });
  const reorderMutation = useMutation({ mutationFn: ({ attributeId, valueIds }: { attributeId: string; valueIds: string[] }) => catalogRepository.reorderAttributeValues(attributeId, valueIds), onSuccess: refresh });

  return {
    attributes: attributesQuery.data || [],
    isLoading: attributesQuery.isLoading,
    isError: attributesQuery.isError,
    createAttribute: createAttributeMutation.mutateAsync,
    isCreatingAttribute: createAttributeMutation.isPending,
    createAttributeValue: createAttributeValueMutation.mutateAsync,
    isCreatingValue: createAttributeValueMutation.isPending,
    deleteAttribute: deleteAttributeMutation.mutateAsync,
    deleteAttributeValue: deleteAttributeValueMutation.mutateAsync,
    reorderAttributeValues: reorderMutation.mutateAsync,
    isReordering: reorderMutation.isPending,
  };
};

export default useAttributes;
