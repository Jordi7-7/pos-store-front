import type { SupplierEntity } from '../entities/supplier.entity';

/** Proveedor que se propone al abrir un ingreso: el "GENERICO" si existe; si no, el primero de la lista. */
export function pickDefaultSupplier(suppliers: SupplierEntity[]): SupplierEntity | undefined {
  const generic = suppliers.find((s) => s.identityNumber.toUpperCase() === 'GENERICO' || s.name.toUpperCase().includes('GENERICO'));
  return generic ?? suppliers[0];
}
