import type { CustomerEntity } from '../../domain/entities/customer.entity';

export interface CustomerInput {
  identityNumber: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

/** Puerto de salida: clientes en el servidor (la implementación va en `infrastructure`). */
export interface CustomersRepository {
  list(): Promise<CustomerEntity[]>;
  create(input: CustomerInput): Promise<CustomerEntity>;
  update(id: string, input: Partial<CustomerInput>): Promise<CustomerEntity>;
  remove(id: string): Promise<void>;
}
