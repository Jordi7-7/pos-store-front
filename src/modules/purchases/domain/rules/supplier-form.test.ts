import { describe, expect, it } from 'vitest';
import type { SupplierEntity } from '../entities/supplier.entity';
import { emptySupplierForm, filterSuppliers, supplierToForm, toSupplierInput, validateSupplierForm } from './supplier-form';

const acme: SupplierEntity = { id: '1', name: 'Acme S.A.', identityNumber: '1792', email: '', phone: '099', address: '' };

describe('formulario de proveedor', () => {
  it('exige nombre e identificación (con espacios no cuentan)', () => {
    expect(validateSupplierForm(emptySupplierForm())).toMatch(/nombre/);
    expect(validateSupplierForm({ ...emptySupplierForm(), name: 'A', identityNumber: '  ' })).toMatch(/RUC/);
    expect(validateSupplierForm({ ...emptySupplierForm(), name: 'A', identityNumber: '1' })).toBeNull();
  });

  it('recorta los textos y omite los opcionales vacíos', () => {
    expect(toSupplierInput({ name: ' Acme ', identityNumber: ' 1 ', email: ' ', phone: ' 099 ', address: '' })).toEqual({
      name: 'Acme', identityNumber: '1', email: undefined, phone: '099', address: undefined,
    });
  });

  it('editar carga los datos del proveedor', () => {
    expect(supplierToForm(acme)).toEqual({ name: 'Acme S.A.', identityNumber: '1792', email: '', phone: '099', address: '' });
  });

  it('filtra por nombre o identificación sin distinguir mayúsculas', () => {
    expect(filterSuppliers([acme], 'acme')).toHaveLength(1);
    expect(filterSuppliers([acme], '179')).toHaveLength(1);
    expect(filterSuppliers([acme], 'zzz')).toHaveLength(0);
    expect(filterSuppliers([acme], '')).toHaveLength(1);
  });
});
