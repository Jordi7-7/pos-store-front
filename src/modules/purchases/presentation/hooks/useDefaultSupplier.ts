import { useEffect, useState } from 'react';
import type { SupplierEntity } from '../../domain/entities/supplier.entity';
import { pickDefaultSupplier } from '../../domain/rules/default-supplier';

/** Proveedor elegido en un formulario de ingreso: arranca con el que propone la regla en cuanto llega la lista. */
export function useDefaultSupplier(suppliers: SupplierEntity[]) {
  const [supplierId, setSupplierId] = useState('');
  useEffect(() => {
    if (supplierId) return;
    const proposed = pickDefaultSupplier(suppliers);
    if (proposed) setSupplierId(proposed.id);
  }, [suppliers, supplierId]);
  return { supplierId, setSupplierId };
}
