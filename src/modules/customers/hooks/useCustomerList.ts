import { useQuery } from '@tanstack/react-query';
import { customersService } from '../services/customers.service';
import type { CustomerEntity } from '../entities/customer.entity';

export const CUSTOMERS_QUERY_KEY = ['customers'] as const;

export const useCustomerList = () => {
  const query = useQuery<CustomerEntity[]>({
    queryKey: CUSTOMERS_QUERY_KEY,
    queryFn: customersService.getCustomers,
  });

  return {
    customers: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};
