import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogRepository, productsRepository } from '../../infrastructure/dependencies';
import type { TagEntity } from '../../domain/entities/catalog.entity';

export const useTags = () => {
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery<TagEntity[]>({ queryKey: ['tags'], queryFn: () => catalogRepository.listTags() });
  const { mutateAsync: createTag, isPending: isCreating } = useMutation({
    mutationFn: (name: string) => catalogRepository.createTag(name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tags'] }),
  });
  const { mutateAsync: updateVariantTags } = useMutation({
    mutationFn: ({ variantId, tagIds }: { variantId: string; tagIds: string[] }) => productsRepository.updateVariantTags(variantId, tagIds),
  });

  return { tags, isLoading, createTag, isCreating, updateVariantTags };
};
