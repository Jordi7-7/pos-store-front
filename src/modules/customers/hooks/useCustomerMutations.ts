import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customersService } from '../services/customers.service';
import { CUSTOMERS_QUERY_KEY } from './useCustomerList';
import type { CreateCustomerDTO, UpdateCustomerDTO } from '../types/customer.types';
import { toast } from 'sonner';

export const useCustomerMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (dto: CreateCustomerDTO) => customersService.createCustomer(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      toast.success('Cliente registrado exitosamente');
    },
    onError: (err: any) => {
      console.error('Error al registrar cliente:', err);
      toast.error(err.response?.data?.message || 'Error al registrar cliente');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCustomerDTO }) =>
      customersService.updateCustomer(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (err: any) => {
      console.error('Error al actualizar cliente:', err);
      toast.error(err.response?.data?.message || 'Error al actualizar cliente');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (err: any) => {
      console.error('Error al eliminar cliente:', err);
      toast.error(err.response?.data?.message || 'Error al eliminar cliente');
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
