import { apiClient } from '@/lib/apiClient';
import type { Customer } from '../types/customers.types';

export const customersService = {
  getCustomers: async (): Promise<Customer[]> => {
    return apiClient.get<Customer[]>('/customers');
  },
  createCustomer: async (dto: Omit<Customer, 'id'>): Promise<Customer> => {
    return apiClient.post<Customer>('/customers', dto);
  },
  updateCustomer: async (id: string, dto: Partial<Omit<Customer, 'id'>>): Promise<Customer> => {
    return apiClient.put<Customer>(`/customers/${id}`, dto);
  },
  deleteCustomer: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/customers/${id}`);
  }
};
