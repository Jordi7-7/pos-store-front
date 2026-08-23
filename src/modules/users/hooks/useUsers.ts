import { useQuery, useMutation } from '@tanstack/react-query';
import { usersService } from '../services/users.service';
import type { CreateUserInput } from '../services/users.service';

export const useCreateUser = () => {
  const createUserMutation = useMutation({
    mutationFn: (input: CreateUserInput) => usersService.createUser(input),
  });

  return {
    createUser: createUserMutation.mutateAsync,
    isCreating: createUserMutation.isPending,
  };
};
export const useGeneratePin = () => {
  const generatePinMutation = useMutation({
    mutationFn: (userId: string) => usersService.generatePin(userId),
  });

  return {
    generatePin: generatePinMutation.mutateAsync,
    isGenerating: generatePinMutation.isPending,
  };
};

export const useUsers = () => {
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getUsers(),
  });

  return {
    users: usersQuery.data || [],
    isLoading: usersQuery.isLoading,
    refetchUsers: usersQuery.refetch,
  };
};
