import { useMutation } from '@tanstack/react-query';
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
export default useCreateUser;
