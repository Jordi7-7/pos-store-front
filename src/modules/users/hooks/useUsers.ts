import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/users.service';
import type { CreateUserInput, UpdateUserInput, UserItem } from '../services/users.service';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/hooks/useSession';

export const useUsers = () => {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();

  const usersQuery = useQuery<UserItem[]>({
    queryKey: ['users', tenantId],
    queryFn: () => usersService.getUsers(),
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
    mutationFn: (input: CreateUserInput) => usersService.createUser(input),
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
      usersService.updateUser(id, input),
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
    mutationFn: (userId: string) => usersService.generatePin(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', tenantId] });
    },
  });

  return {
    generatePin: generatePinMutation.mutateAsync,
    isGenerating: generatePinMutation.isPending,
  };
};
