import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashRegistersRepository } from '../../infrastructure/dependencies';
import type { CreateCashRegisterInput, UpdateCashRegisterInput } from '../../application/ports/cash-registers.repository';
import type { CashRegisterEntity, MyCashRegisterEntity } from '../../domain/entities/cash-register.entity';
import { useIsAuthenticated, useTenantId } from '@/modules/auth/presentation/hooks/useSession';
import { toast } from 'sonner';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';

export const useMyCashRegisters = (branchId?: string) => {
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();

  const query = useQuery<MyCashRegisterEntity[]>({
    queryKey: ['my-cash-registers', tenantId, branchId || 'all'],
    queryFn: () => cashRegistersRepository.listMine(branchId),
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
  const tenantId = useTenantId();
  const isAuthenticated = useIsAuthenticated();

  const query = useQuery<CashRegisterEntity[]>({
    queryKey: ['cash-registers', tenantId, branchId || 'all'],
    queryFn: () => cashRegistersRepository.list(branchId),
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
    mutationFn: (input: CreateCashRegisterInput) => cashRegistersRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      toast.success('Caja registradora creada correctamente');
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, 'Error al crear la caja registradora'));
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
      cashRegistersRepository.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      toast.success('Caja registradora actualizada correctamente');
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, 'Error al actualizar la caja registradora'));
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
      cashRegistersRepository.assignUsers(id, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuarios asignados correctamente a la caja');
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, 'Error al asignar usuarios a la caja'));
    },
  });

  return {
    assignUsers: mutation.mutateAsync,
    isAssigning: mutation.isPending,
  };
};
