import { describe, expect, it } from 'vitest';
import { addScannedProduct, emptyPurchaseLine } from './purchase-lines';

const camisa = { id: 'v1', sku: 'CAM-1', productName: 'Camisa', purchasePrice: 50 };
const pantalon = { id: 'v2', sku: 'PAN-1', productName: 'Pantalón', purchasePrice: 80 };

describe('productos escaneados en un ingreso', () => {
  it('el primero ocupa la fila vacía y deja otra vacía para seguir', () => {
    const lines = addScannedProduct([emptyPurchaseLine()], camisa);
    expect(lines.map((line) => line.variantSku)).toEqual(['CAM-1', '']);
    expect(lines[0]).toMatchObject({ quantity: 1, unitCost: 50 });
  });

  it('escanear el mismo producto otra vez suma una unidad en su fila, sin duplicarla', () => {
    const once = addScannedProduct([emptyPurchaseLine()], camisa);
    const twice = addScannedProduct(once, camisa);
    expect(twice.filter((line) => line.variantId === 'v1')).toHaveLength(1);
    expect(twice[0]?.quantity).toBe(2);
    expect(twice).toHaveLength(2);
  });

  it('un producto distinto va a la siguiente fila vacía', () => {
    const lines = addScannedProduct(addScannedProduct([emptyPurchaseLine()], camisa), pantalon);
    expect(lines.map((line) => line.variantSku)).toEqual(['CAM-1', 'PAN-1', '']);
  });

  it('si no queda ninguna fila vacía, añade una', () => {
    const full = [{ ...emptyPurchaseLine(), variantId: 'v1', variantSku: 'CAM-1', productName: 'Camisa' }];
    expect(addScannedProduct(full, pantalon).map((line) => line.variantSku)).toEqual(['CAM-1', 'PAN-1', '']);
  });
});
