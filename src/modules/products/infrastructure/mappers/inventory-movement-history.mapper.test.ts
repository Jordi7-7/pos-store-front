import { describe, expect, it } from 'vitest';
import { InventoryMovementCategory, InventoryMovementType } from '../../domain/enums';
import { toInventoryDocumentDetailEntity, toInventoryMovementHistoryEntity } from './inventory.mapper';

const dto = {
  id: 'm1', createdAt: '2026-11-05T18:30:00.000Z', type: 'OUT', reason: 'VENTA', quantity: '3' as unknown as number, variantId: 'v1', sku: 'CAM-M',
  productName: 'Camisa', originBranch: { id: 'b1', name: 'Centro' }, destinationBranch: null,
};

describe('mapper del historial de movimientos', () => {
  it('convierte la respuesta del backend en la entidad', () => {
    expect(toInventoryMovementHistoryEntity(dto)).toEqual({
      id: 'm1', createdAt: new Date('2026-11-05T18:30:00.000Z'), type: InventoryMovementType.OUT, category: null, reason: 'VENTA', quantity: 3, unitCost: null, balanceAfter: null,
      variantId: 'v1', sku: 'CAM-M', productName: 'Camisa', originBranchName: 'Centro', destinationBranchName: null, document: null,
    });
  });

  it('trae la categoría, el costo y el saldo; en filas anteriores (sin ellos) quedan en null', () => {
    expect(toInventoryMovementHistoryEntity({ ...dto, category: 'SALE', unitCost: 3.5, balanceAfter: 12 })).toMatchObject({ category: InventoryMovementCategory.SALE, unitCost: 3.5, balanceAfter: 12 });
    expect(toInventoryMovementHistoryEntity({ ...dto, category: null, unitCost: null, balanceAfter: null })).toMatchObject({ category: null, unitCost: null, balanceAfter: null });
    expect(toInventoryMovementHistoryEntity({ ...dto, balanceAfter: 0 })).toMatchObject({ balanceAfter: 0 });
  });

  it('una categoría desconocida (un backend más nuevo) se trata como sin categoría, sin inventarla', () => {
    expect(toInventoryMovementHistoryEntity({ ...dto, category: 'ALGO_NUEVO' })).toMatchObject({ category: null });
  });

  it('un tipo desconocido se trata como salida y no se inventa un motivo', () => {
    expect(toInventoryMovementHistoryEntity({ ...dto, type: 'X', reason: 'ALGO' })).toMatchObject({ type: InventoryMovementType.OUT, reason: 'ALGO' });
  });
});

describe('mapper de un documento abierto', () => {
  const outgoing = { variantId: 'v1', sku: 'CAM-M', productName: 'Camisa', type: 'OUT', quantity: '4' as unknown as number, branchName: 'Matriz', unitCost: 3, balanceAfter: 6 };
  const incoming = { variantId: 'v1', sku: 'CAM-M', productName: 'Camisa', type: 'IN', quantity: 4, branchName: 'Norte', unitCost: null };
  const detail = {
    id: 'd1', number: 'TRS-000001', kind: 'TRANSFER', reason: 'TRASLADO', comment: null, createdAt: '2026-11-05T18:30:00.000Z', userName: 'Ana',
    branch: { id: 'b1', name: 'Matriz' }, destinationBranch: { id: 'b2', name: 'Norte' }, lines: [outgoing, incoming],
  };

  it('convierte la cabecera y las líneas; el costo y el saldo ausentes quedan en null y el 0 se conserva', () => {
    const entity = toInventoryDocumentDetailEntity(detail);

    expect(entity).toMatchObject({ id: 'd1', number: 'TRS-000001', kind: 'TRANSFER', branchName: 'Matriz', destinationBranchName: 'Norte', userName: 'Ana', comment: null });
    expect(entity.lines).toMatchObject([
      { type: InventoryMovementType.OUT, quantity: 4, unitCost: 3, balanceAfter: 6, branchName: 'Matriz' },
      { type: InventoryMovementType.IN, unitCost: null, balanceAfter: null },
    ]);
    expect(toInventoryDocumentDetailEntity({ ...detail, lines: [{ ...outgoing, balanceAfter: 0 }] }).lines).toMatchObject([{ balanceAfter: 0 }]);
  });

  it('sin sucursal de destino es null, y un tipo de documento o de línea desconocido no se inventa', () => {
    expect(toInventoryDocumentDetailEntity({ ...detail, destinationBranch: null }).destinationBranchName).toBeNull();
    expect(toInventoryDocumentDetailEntity({ ...detail, lines: [{ ...outgoing, type: 'X' }] }).lines).toMatchObject([{ type: InventoryMovementType.OUT }]);
  });
});
