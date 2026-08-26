import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersService } from '../services/customers.service';
import type { Customer } from '../types/customers.types';
import { toast } from 'sonner';

export const useCustomers = () => {
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: customersService.getCustomers,
  });

  const createMutation = useMutation({
    mutationFn: customersService.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente registrado exitosamente');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Error al registrar cliente');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<Omit<Customer, 'id'>> }) => 
      customersService.updateCustomer(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Error al actualizar cliente');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente eliminado exitosamente');
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Error al eliminar cliente');
    }
  });

  return {
    customers,
    isLoading,
    createCustomer: createMutation.mutateAsync,
    updateCustomer: updateMutation.mutateAsync,
    deleteCustomer: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
