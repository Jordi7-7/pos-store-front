import { apiClient } from '@/lib/apiClient';
import type { CustomerInput, CustomersRepository } from '../../application/ports/customers.repository';
import type { CustomerEntity } from '../../domain/entities/customer.entity';
import type { CustomerDTO } from '../dtos/customer.dto';
import { toCustomerEntities, toCustomerEntity } from '../mappers/customer.mapper';

/** Clientes por HTTP: convierte las respuestas (DTO) en entidades del dominio. */
export class CustomersHttpRepository implements CustomersRepository {
  async list(): Promise<CustomerEntity[]> {
    return toCustomerEntities(await apiClient.get<CustomerDTO[]>('/customers'));
  }

  async create(input: CustomerInput): Promise<CustomerEntity> {
    return toCustomerEntity(await apiClient.post<CustomerDTO>('/customers', input));
  }

  async update(id: string, input: Partial<CustomerInput>): Promise<CustomerEntity> {
    return toCustomerEntity(await apiClient.put<CustomerDTO>(`/customers/${id}`, input));
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  }
}
