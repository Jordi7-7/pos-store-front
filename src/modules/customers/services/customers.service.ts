import { apiClient } from '@/lib/apiClient';
import type { CustomerDTO, CreateCustomerDTO, UpdateCustomerDTO } from '../types/customer.types';
import type { CustomerEntity } from '../entities/customer.entity';
import { toCustomerEntity, toCustomerEntities } from '../mappers/customer.mapper';

export const customersService = {
  getCustomers: async (): Promise<CustomerEntity[]> => {
    const raw = await apiClient.get<CustomerDTO[]>('/customers');
    return toCustomerEntities(raw);
  },

  createCustomer: async (dto: CreateCustomerDTO): Promise<CustomerEntity> => {
    const raw = await apiClient.post<CustomerDTO>('/customers', dto);
    return toCustomerEntity(raw);
  },

  updateCustomer: async (id: string, dto: UpdateCustomerDTO): Promise<CustomerEntity> => {
    const raw = await apiClient.put<CustomerDTO>(`/customers/${id}`, dto);
    return toCustomerEntity(raw);
  },

  deleteCustomer: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/customers/${id}`);
  },
};
