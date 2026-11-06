import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFormatters } from '@/modules/auth/presentation/hooks/useFormatters';
import { customersRepository } from '../../infrastructure/dependencies';
import type { CustomerEntity } from '../../domain/customer.entity';
import { toCustomerVM } from '../view-models/customer.vm';

export const CUSTOMERS_QUERY_KEY = ['customers'] as const;

export const useCustomerList = () => {
  const fmt = useFormatters();
  const query = useQuery<CustomerEntity[]>({
    queryKey: CUSTOMERS_QUERY_KEY,
    queryFn: () => customersRepository.list(),
  });
  const customers = useMemo(() => (query.data ?? []).map((customer) => toCustomerVM(customer, fmt)), [query.data, fmt]);

  return {
    customers,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
