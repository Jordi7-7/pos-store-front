import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersRepository } from '../../infrastructure/dependencies';
import type { CreateUserInput, UpdateUserInput } from '../../application/ports/users.repository';
import type { UserEntity } from '../../domain/entities/user.entity';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/presentation/hooks/useSession';

export const useUsers = () => {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();

  const usersQuery = useQuery<UserEntity[]>({
    queryKey: ['users', tenantId],
    queryFn: () => usersRepository.list(),
    enabled: isAuthenticated && Boolean(tenantId),
  });

  return {
    users: usersQuery.data || [],
    isLoading: usersQuery.isLoading,
    refetchUsers: usersQuery.refetch,
  };
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const createUserMutation = useMutation({
    mutationFn: (input: CreateUserInput) => usersRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', tenantId] });
    },
  });

  return {
    createUser: createUserMutation.mutateAsync,
    isCreating: createUserMutation.isPending,
  };
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const updateUserMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      usersRepository.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', tenantId] });
    },
  });

  return {
    updateUser: updateUserMutation.mutateAsync,
    isUpdating: updateUserMutation.isPending,
  };
};

export const useGeneratePin = () => {
  const queryClient = useQueryClient();
  const tenantId = useTenantId();

  const generatePinMutation = useMutation({
    mutationFn: (userId: string) => usersRepository.generatePin(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', tenantId] });
    },
  });

  return {
    generatePin: generatePinMutation.mutateAsync,
    isGenerating: generatePinMutation.isPending,
  };
};
