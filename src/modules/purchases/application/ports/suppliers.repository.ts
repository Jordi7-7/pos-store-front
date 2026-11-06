import type { SupplierEntity } from '../../domain/entities/supplier.entity';

export interface CreateSupplierInput {
  identityNumber: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

/** Puerto de salida: proveedores del negocio. */
export interface SuppliersRepository {
  list(): Promise<SupplierEntity[]>;
  create(input: CreateSupplierInput): Promise<SupplierEntity>;
  update(id: string, input: UpdateSupplierInput): Promise<SupplierEntity>;
  remove(id: string): Promise<void>;
}
