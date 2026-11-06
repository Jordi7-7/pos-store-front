import { describe, expect, it } from 'vitest';
import { isPurchaseTemplate, MAX_BULK_PURCHASE_ROWS, mergeImportErrors, normalizePurchaseRows, rowLimitMessage } from './purchase-sheet';

describe('hoja de ingreso masivo', () => {
  it('solo acepta la plantilla con SKU y Cantidad, sin columnas de otras plantillas', () => {
    expect(isPurchaseTemplate([' SKU ', 'Cantidad'])).toBe(true);
    expect(isPurchaseTemplate(['sku'])).toBe(false);
    expect(isPurchaseTemplate(['sku', 'cantidad', 'Precio Compra'])).toBe(false);
    expect(isPurchaseTemplate(['sku', 'cantidad', 'nombre'])).toBe(false);
  });

  it('normaliza filas: recorta el SKU, descarta las vacías y deja en 0 la cantidad ilegible (si no, un NaN pasaría la validación)', () => {
    expect(normalizePurchaseRows([{ SKU: ' A-1 ', Cantidad: 3 }, { sku: 'B', cantidad: 'x' }, { SKU: '  ', Cantidad: 5 }, { Cantidad: 2 }])).toEqual([
      { sku: 'A-1', quantity: 3 },
      { sku: 'B', quantity: 0 },
    ]);
  });

  it('límite de filas: avisa por encima, no en el tope', () => {
    expect(rowLimitMessage(MAX_BULK_PURCHASE_ROWS)).toBeNull();
    expect(rowLimitMessage(MAX_BULK_PURCHASE_ROWS + 1)).toContain(String(MAX_BULK_PURCHASE_ROWS + 1));
  });

  it('una cantidad de 0 o negativa invalida la fila aunque el servidor no la objete', () => {
    const merged = mergeImportErrors([{ sku: 'A', quantity: 0 }, { sku: 'B', quantity: 2 }, { sku: 'C', quantity: -1 }], { B: 'No existe' });
    expect(Object.keys(merged).sort()).toEqual(['A', 'B', 'C']);
    expect(merged.B).toBe('No existe');
  });
});
