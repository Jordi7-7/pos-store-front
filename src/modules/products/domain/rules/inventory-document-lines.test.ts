import { describe, expect, it } from 'vitest';
import { InventoryDocumentKind } from '../enums';
import { addDocumentLine, documentBlocker, isCommentRequired, documentSummary, lineShortages, removeDocumentLine, toDocumentLines, transferBranchBlocker, updateDocumentLine, type DocumentFormLine, type NewDocumentLine } from './inventory-document-lines';

const product = (variantId: string, stock = 5): NewDocumentLine => ({ variantId, sku: variantId.toUpperCase(), productName: `Producto ${variantId}`, referenceCost: 4, stock });
const line = (variantId: string, quantity: number, extra: Partial<DocumentFormLine> = {}): DocumentFormLine => ({ ...product(variantId), quantity, ...extra });

describe('líneas del documento de inventario', () => {
  it('agregar el mismo producto dos veces suma una unidad, no duplica la línea', () => {
    const lines = addDocumentLine(addDocumentLine([], product('a')), product('a'));

    expect(lines).toHaveLength(1);
    expect(lines[0]?.quantity).toBe(2);
  });

  it('productos distintos son líneas distintas y no se modifica la lista original', () => {
    const original = [line('a', 1)];
    const next = addDocumentLine(original, product('b'));

    expect(next.map((l) => l.variantId)).toEqual(['a', 'b']);
    expect(original).toHaveLength(1);
  });

  it('actualiza y quita solo la línea indicada', () => {
    const lines = [line('a', 1), line('b', 1)];

    expect(updateDocumentLine(lines, 'b', { quantity: 7 }).map((l) => l.quantity)).toEqual([1, 7]);
    expect(removeDocumentLine(lines, 'a').map((l) => l.variantId)).toEqual(['b']);
  });

  it('en una salida marca las líneas que piden más de lo que hay; en una entrada nunca', () => {
    const lines = [line('a', 3, { stock: 5 }), line('b', 6, { stock: 5 }), line('c', 1, { stock: 0 })];

    expect(lineShortages(lines, InventoryDocumentKind.EXIT).map((l) => l.variantId)).toEqual(['b', 'c']);
    expect(lineShortages(lines, InventoryDocumentKind.TRANSFER).map((l) => l.variantId)).toEqual(['b', 'c']);
    expect(lineShortages(lines, InventoryDocumentKind.ENTRY)).toEqual([]);
  });

  it('resume productos y unidades con exactitud decimal', () => {
    expect(documentSummary([line('a', 0.1), line('b', 0.2)])).toEqual({ products: 2, units: 0.3 });
    expect(documentSummary([])).toEqual({ products: 0, units: 0 });
  });

  it('dice por qué no se puede confirmar', () => {
    const E = InventoryDocumentKind.ENTRY;
    const X = InventoryDocumentKind.EXIT;
    expect(documentBlocker(E, [line('a', 1)], undefined, '')).toBe('Elige un motivo.');
    expect(documentBlocker(X, [], 'MERMA', 'se rompió')).toBe('Agrega al menos un producto.');
    expect(documentBlocker(X, [line('a', 0)], 'MERMA', 'se rompió')).toBe('Todas las cantidades deben ser mayores a 0.');
    expect(documentBlocker(E, [line('a', 1, { unitCost: -1 })], 'DONACION', '')).toBe('El costo no puede ser negativo.');
    expect(documentBlocker(X, Array.from({ length: 201 }, (_, i) => line(`v${i}`, 1)), 'MERMA', 'se rompió')).toContain('200');
    expect(documentBlocker(X, [line('a', 1)], 'MERMA', 'se rompió')).toBeNull();
  });

  it('el traslado no pide motivo', () => {
    expect(documentBlocker(InventoryDocumentKind.TRANSFER, [line('a', 1)], undefined, '')).toBeNull();
    expect(documentBlocker(InventoryDocumentKind.TRANSFER, [], undefined, '')).toBe('Agrega al menos un producto.');
  });

  it('toda salida y todo OTRO exigen un comentario de verdad; una entrada con motivo propio no', () => {
    const X = InventoryDocumentKind.EXIT;
    const E = InventoryDocumentKind.ENTRY;
    const needs = 'Escribe un comentario que explique el movimiento.';
    for (const reason of ['MERMA', 'PERDIDA', 'USO_INTERNO', 'DEVOLUCION_PROVEEDOR', 'OTRO']) {
      expect(documentBlocker(X, [line('a', 1)], reason, '')).toBe(needs);
      expect(documentBlocker(X, [line('a', 1)], reason, '   ')).toBe(needs);
      expect(documentBlocker(X, [line('a', 1)], reason, 'ab')).toBe(needs);
      expect(documentBlocker(X, [line('a', 1)], reason, '  robo  ')).toBeNull();
    }
    expect(documentBlocker(E, [line('a', 1)], 'OTRO', '')).toBe(needs);
    expect(documentBlocker(E, [line('a', 1)], 'OTRO', 'muestra del fabricante')).toBeNull();
    expect(documentBlocker(E, [line('a', 1)], 'DONACION', '')).toBeNull();
    expect(documentBlocker(E, [line('a', 1)], 'PRODUCCION', '')).toBeNull();
  });

  it('isCommentRequired replica la regla del backend', () => {
    expect(isCommentRequired(InventoryDocumentKind.EXIT, 'MERMA')).toBe(true);
    expect(isCommentRequired(InventoryDocumentKind.ENTRY, 'OTRO')).toBe(true);
    expect(isCommentRequired(InventoryDocumentKind.ENTRY, 'DONACION')).toBe(false);
    expect(isCommentRequired(InventoryDocumentKind.TRANSFER, undefined)).toBe(false);
  });

  it('el costo solo viaja en las entradas y solo si se escribió', () => {
    const lines = [line('a', 2, { unitCost: 3.5 }), line('b', 1)];

    expect(toDocumentLines(lines, InventoryDocumentKind.ENTRY)).toEqual([{ variantId: 'a', quantity: 2, unitCost: 3.5 }, { variantId: 'b', quantity: 1 }]);
    expect(toDocumentLines(lines, InventoryDocumentKind.EXIT)).toEqual([{ variantId: 'a', quantity: 2 }, { variantId: 'b', quantity: 1 }]);
  });
});

describe('sucursales de un traslado', () => {
  it('pide el destino y no deja que sea el mismo que el origen', () => {
    expect(transferBranchBlocker('a', '')).toBe('Elige la sucursal de destino.');
    expect(transferBranchBlocker('a', 'a')).toBe('El destino debe ser una sucursal distinta del origen.');
    expect(transferBranchBlocker('a', 'b')).toBeNull();
  });

  it('el costo nunca viaja en un traslado', () => {
    expect(toDocumentLines([{ variantId: 'a', sku: 'A', productName: 'A', quantity: 2, unitCost: 5, referenceCost: 1, stock: 9 }], InventoryDocumentKind.TRANSFER)).toEqual([{ variantId: 'a', quantity: 2 }]);
  });
});

