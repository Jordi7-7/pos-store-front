import type { Formatters } from '@/shared/presentation/formatters';
import type { CustomerEntity } from '../../domain/entities/customer.entity';

/** Cliente con los textos listos para mostrar (iniciales del avatar y fecha de alta en la zona de la tienda). */
export type CustomerVM = CustomerEntity & { initials: string; createdAtFormatted: string };

/** Iniciales del nombre: la del nombre y la del apellido, o las dos primeras letras si es una sola palabra. */
export const getCustomerInitials = (name?: string): string => {
  if (!name || !name.trim()) return 'CL';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0] ?? '').slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
};

export const toCustomerVM = (customer: CustomerEntity, fmt: Formatters): CustomerVM => ({
  ...customer,
  initials: getCustomerInitials(customer.name),
  createdAtFormatted: fmt.dateTime(customer.createdAt),
});
