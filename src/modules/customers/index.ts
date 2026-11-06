// API pública del módulo.
export type { CustomerEntity } from './domain/entities/customer.entity';
export { DEFAULT_CUSTOMER } from './domain/entities/customer.entity';
export type { CustomerVM } from './presentation/view-models/customer.vm';
export * from './presentation/hooks/useCustomerList';
export * from './presentation/hooks/useCustomerMutations';
export * from './presentation/components/CustomersView';
