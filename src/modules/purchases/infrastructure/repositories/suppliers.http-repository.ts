import { apiClient } from '@/lib/apiClient';
import type { CreateSupplierInput, SuppliersRepository, UpdateSupplierInput } from '../../application/ports/suppliers.repository';
import type { SupplierEntity } from '../../domain/entities/supplier.entity';
import type { SupplierDto } from '../dtos/purchase.dto';
import { toSupplierEntity } from '../mappers/supplier.mapper';

export class SuppliersHttpRepository implements SuppliersRepository {
  async list(): Promise<SupplierEntity[]> {
    return (await apiClient.get<SupplierDto[]>('/purchases/suppliers')).map(toSupplierEntity);
  }

  async create(input: CreateSupplierInput): Promise<SupplierEntity> {
    return toSupplierEntity(await apiClient.post<SupplierDto>('/purchases/suppliers', input));
  }

  async update(id: string, input: UpdateSupplierInput): Promise<SupplierEntity> {
    return toSupplierEntity(await apiClient.put<SupplierDto>(`/purchases/suppliers/${id}`, input));
  }

  remove(id: string): Promise<void> {
    return apiClient.delete<void>(`/purchases/suppliers/${id}`);
  }
}
