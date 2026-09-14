import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  cashRegistersService,
  type CreateCashRegisterInput,
  type UpdateCashRegisterInput,
} from '../services/cash-registers.service';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import { toast } from 'sonner';

export const useMyCashRegisters = (branchId?: string) => {
  const { tenantId, isAuthenticated } = useAuthStore();

  const query = useQuery({
    queryKey: ['my-cash-registers', tenantId, branchId || 'all'],
    queryFn: () => cashRegistersService.getMyCashRegisters(branchId),
    enabled: isAuthenticated && !!tenantId,
  });

  return {
    myCashRegisters: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useCashRegisters = (branchId?: string) => {
  const { tenantId, isAuthenticated } = useAuthStore();

  const query = useQuery({
    queryKey: ['cash-registers', tenantId, branchId || 'all'],
    queryFn: () => cashRegistersService.getCashRegisters(branchId),
    enabled: isAuthenticated && !!tenantId,
  });

  return {
    cashRegisters: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
};

export const useCreateCashRegister = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: CreateCashRegisterInput) => cashRegistersService.createCashRegister(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      toast.success('Caja registradora creada correctamente');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Error al crear la caja registradora');
    },
  });

  return {
    createRegister: mutation.mutateAsync,
    isCreating: mutation.isPending,
  };
};

export const useUpdateCashRegister = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCashRegisterInput }) =>
      cashRegistersService.updateCashRegister(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      toast.success('Caja registradora actualizada correctamente');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Error al actualizar la caja registradora');
    },
  });

  return {
    updateRegister: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
};

export const useAssignUsersToRegister = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
      cashRegistersService.assignUsers(id, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuarios asignados correctamente a la caja');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Error al asignar usuarios a la caja');
    },
  });

  return {
    assignUsers: mutation.mutateAsync,
    isAssigning: mutation.isPending,
  };
};
