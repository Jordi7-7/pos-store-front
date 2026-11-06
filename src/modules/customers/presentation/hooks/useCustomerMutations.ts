import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customersRepository } from '../../infrastructure/dependencies';
import { CUSTOMERS_QUERY_KEY } from './useCustomerList';
import type { CustomerInput } from '../../application/ports/customers.repository';
import { toast } from 'sonner';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';

export const useCustomerMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (input: CustomerInput) => customersRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      toast.success('Cliente registrado exitosamente');
    },
    onError: (err: unknown) => {
      console.error('Error al registrar cliente:', err);
      toast.error(getErrorMessage(err, 'Error al registrar cliente'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CustomerInput> }) =>
      customersRepository.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (err: unknown) => {
      console.error('Error al actualizar cliente:', err);
      toast.error(getErrorMessage(err, 'Error al actualizar cliente'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersRepository.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (err: unknown) => {
      console.error('Error al eliminar cliente:', err);
      toast.error(getErrorMessage(err, 'Error al eliminar cliente'));
    },
  });

  return {
    createCustomer: createMutation.mutateAsync,
    updateCustomer: updateMutation.mutateAsync,
    deleteCustomer: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
