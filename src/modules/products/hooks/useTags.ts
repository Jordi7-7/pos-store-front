import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService } from '../services/products.service';
import type { Tag } from '../services/products.service';

export const useTags = () => {
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => productsService.getTags(),
  });

  const { mutateAsync: createTag, isPending: isCreating } = useMutation({
    mutationFn: (name: string) => productsService.createTag(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  const { mutateAsync: updateVariantTags } = useMutation({
    mutationFn: ({ variantId, tagIds }: { variantId: string; tagIds: string[] }) =>
      productsService.updateVariantTags(variantId, tagIds),
  });

  return { tags, isLoading, createTag, isCreating, updateVariantTags };
};
