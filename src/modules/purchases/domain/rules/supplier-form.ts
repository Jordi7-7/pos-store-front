import type { SupplierEntity } from '../entities/supplier.entity';

/** Lo que se escribe en el formulario de proveedor (todo texto, tal como lo teclea la persona). */
export interface SupplierFormValues {
  name: string;
  identityNumber: string;
  email: string;
  phone: string;
  address: string;
}

export const emptySupplierForm = (): SupplierFormValues => ({ name: '', identityNumber: '', email: '', phone: '', address: '' });

export const supplierToForm = (supplier: SupplierEntity): SupplierFormValues => ({
  name: supplier.name,
  identityNumber: supplier.identityNumber,
  email: supplier.email || '',
  phone: supplier.phone || '',
  address: supplier.address || '',
});

/** Mensaje de lo que falta, o `null` si el formulario se puede enviar. */
export function validateSupplierForm(values: SupplierFormValues): string | null {
  if (!values.name.trim()) return 'Ingresa el nombre o razón social';
  if (!values.identityNumber.trim()) return 'Ingresa el RUC o identificación';
  return null;
}

/** Datos para el servidor: textos recortados y los opcionales vacíos se omiten. */
export function toSupplierInput(values: SupplierFormValues) {
  return {
    name: values.name.trim(),
    identityNumber: values.identityNumber.trim(),
    email: values.email.trim() || undefined,
    phone: values.phone.trim() || undefined,
    address: values.address.trim() || undefined,
  };
}

/** Busca por nombre o identificación, sin distinguir mayúsculas. */
export function filterSuppliers(suppliers: SupplierEntity[], term: string): SupplierEntity[] {
  const needle = term.toLowerCase();
  return suppliers.filter((s) => s.name.toLowerCase().includes(needle) || (s.identityNumber || '').toLowerCase().includes(needle));
}
