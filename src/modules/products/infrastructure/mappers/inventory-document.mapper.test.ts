import { describe, expect, it } from 'vitest';
import { InventoryDocumentKind, InventoryMovementType } from '../../domain/enums';
import { toInventoryDocumentEntity } from './inventory.mapper';

const dto = {
  id: 'd1', number: 'CNT-000001', kind: 'COUNT', reason: 'CONTEO_FISICO', comment: null, branchId: 'b1', createdAt: '2026-11-18T10:00:00.000Z',
  lines: [{ variantId: 'v1', sku: 'CAM-M', quantity: '2', type: 'OUT' }, { variantId: 'v2', sku: 'GOR-N', quantity: 3, type: 'IN' }],
};

describe('mapper del documento de inventario', () => {
  it('convierte un conteo: tipo, fecha y líneas con su sentido (suma o resta)', () => {
    expect(toInventoryDocumentEntity(dto)).toEqual({
      id: 'd1', number: 'CNT-000001', kind: InventoryDocumentKind.COUNT, reason: 'CONTEO_FISICO', comment: null, branchId: 'b1', destinationBranchId: null, createdAt: new Date('2026-11-18T10:00:00.000Z'),
      lines: [{ variantId: 'v1', sku: 'CAM-M', quantity: 2, type: InventoryMovementType.OUT }, { variantId: 'v2', sku: 'GOR-N', quantity: 3, type: InventoryMovementType.IN }],
    });
  });

  it('reconoce entradas y salidas, y un tipo desconocido se trata como salida', () => {
    expect(toInventoryDocumentEntity({ ...dto, kind: 'ENTRY' }).kind).toBe(InventoryDocumentKind.ENTRY);
    expect(toInventoryDocumentEntity({ ...dto, kind: 'EXIT' }).kind).toBe(InventoryDocumentKind.EXIT);
    expect(toInventoryDocumentEntity({ ...dto, kind: 'RARO' }).kind).toBe(InventoryDocumentKind.EXIT);
  });

  it('un traslado trae la sucursal que recibe', () => {
    const transfer = toInventoryDocumentEntity({ ...dto, kind: 'TRANSFER', number: 'TRS-000001', destinationBranchId: 'b2' });

    expect(transfer).toMatchObject({ kind: InventoryDocumentKind.TRANSFER, branchId: 'b1', destinationBranchId: 'b2' });
  });
});
