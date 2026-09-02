import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/users.service';
import type { CreateUserInput, UpdateUserInput, UserItem } from '../services/users.service';

export const useUsers = () => {
  const usersQuery = useQuery<UserItem[]>({
    queryKey: ['users'],
    queryFn: () => usersService.getUsers(),
  });

  return {
    users: usersQuery.data || [],
    isLoading: usersQuery.isLoading,
    refetchUsers: usersQuery.refetch,
  };
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const createUserMutation = useMutation({
    mutationFn: (input: CreateUserInput) => usersService.createUser(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    createUser: createUserMutation.mutateAsync,
    isCreating: createUserMutation.isPending,
  };
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const updateUserMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
      usersService.updateUser(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    updateUser: updateUserMutation.mutateAsync,
    isUpdating: updateUserMutation.isPending,
  };
};

export const useGeneratePin = () => {
  const queryClient = useQueryClient();
  const generatePinMutation = useMutation({
    mutationFn: (userId: string) => usersService.generatePin(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return {
    generatePin: generatePinMutation.mutateAsync,
    isGenerating: generatePinMutation.isPending,
  };
};
