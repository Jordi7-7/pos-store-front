import { describe, expect, it } from 'vitest';
import type { SupplierEntity } from '../entities/supplier.entity';
import { assignProduct, emptyPurchaseLine, filledLines, lineSubtotal, purchaseTotal, removeLine, toPurchaseRequest } from './purchase-lines';
import { pickDefaultSupplier } from './default-supplier';

const product = { id: 'v1', sku: 'A-1', productName: 'Playera', purchasePrice: 10.1 };
const supplier = (id: string, name: string, identityNumber = '1'): SupplierEntity => ({ id, name, identityNumber, email: '', phone: '', address: '' });

describe('filas de un ingreso', () => {
  it('el total redondea al céntimo (3 × 0.1 no da 0.30000000000000004)', () => {
    expect(lineSubtotal({ ...emptyPurchaseLine(), quantity: 3, unitCost: 0.1 })).toBe(0.3);
    expect(purchaseTotal([{ ...emptyPurchaseLine(), quantity: 3, unitCost: 0.1 }, { ...emptyPurchaseLine(), quantity: 1, unitCost: 0.2 }])).toBe(0.5);
  });

  it('asignar un producto a la última fila añade otra vacía; a una intermedia no', () => {
    const lines = assignProduct([emptyPurchaseLine()], 0, product);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ variantId: 'v1', unitCost: 10.1 });
    expect(assignProduct(lines, 0, { ...product, id: 'v2' })).toHaveLength(2);
  });

  it('quitar la única fila la deja vacía; quitar otra la elimina', () => {
    expect(removeLine([{ ...emptyPurchaseLine(), variantId: 'v1' }], 0)).toEqual([emptyPurchaseLine()]);
    expect(removeLine(assignProduct([emptyPurchaseLine()], 0, product), 1)).toHaveLength(1);
  });

  it('la petición lleva solo filas con producto, referencia recortada y proveedor opcional', () => {
    const lines = assignProduct([emptyPurchaseLine()], 0, product).map((l, i) => (i === 0 ? { ...l, quantity: 4 } : l));
    expect(filledLines(lines)).toHaveLength(1);
    expect(toPurchaseRequest(lines, 'b1', '', '  F-1 ')).toEqual({
      branchId: 'b1', supplierId: undefined, invoiceNumber: 'F-1', items: [{ variantId: 'v1', quantity: 4, purchasePrice: 10.1 }],
    });
    expect(toPurchaseRequest(lines, 'b1', 's1', '   ').invoiceNumber).toBeUndefined();
  });
});

describe('proveedor por defecto', () => {
  it('prefiere el GENERICO, si no el primero, y sin proveedores nada', () => {
    expect(pickDefaultSupplier([supplier('a', 'Acme'), supplier('g', 'Proveedor Genérico', 'GENERICO')])?.id).toBe('g');
    expect(pickDefaultSupplier([supplier('a', 'Acme'), supplier('b', 'Beta')])?.id).toBe('a');
    expect(pickDefaultSupplier([])).toBeUndefined();
  });
});
