import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export interface Customer {
  id: string;
  name: string;
  identityNumber: string;
  email?: string;
  phone?: string;
}

export const useCustomers = () => {
  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['customers'],
    queryFn: async () => {
      return apiClient.get<Customer[]>('/customers');
    },
  });

  return {
    customers,
    isLoading,
  };
};
