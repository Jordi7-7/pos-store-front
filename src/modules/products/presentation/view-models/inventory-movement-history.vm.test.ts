import { describe, expect, it } from 'vitest';
import { createFormatters } from '@/shared/presentation/formatting/formatters';
import { InventoryDocumentKind, InventoryMovementCategory, InventoryMovementType } from '../../domain/enums';
import type { InventoryDocumentDetailEntity, InventoryDocumentListItemEntity, InventoryMovementHistoryEntity } from '../../domain/entities/inventory.entity';
import { toInventoryDocumentDetailVM, toInventoryDocumentListItemVM, toInventoryMovementHistoryVM } from './inventory.vm';

const mxn = createFormatters({ currencyCode: 'MXN', locale: 'es-MX', timezone: 'America/Mexico_City' });

const movement = (overrides: Partial<InventoryMovementHistoryEntity> = {}): InventoryMovementHistoryEntity => ({
  id: 'm', createdAt: new Date('2026-11-05T18:30:00Z'), type: InventoryMovementType.IN, category: InventoryMovementCategory.PURCHASE, reason: 'COMPRA', quantity: 10, unitCost: 4, balanceAfter: 25, variantId: 'v', sku: 'CAM-M',
  productName: 'Camisa', originBranchName: null, destinationBranchName: 'Centro', document: null, ...overrides,
});

describe('view-model del historial de movimientos', () => {
  it('muestra el saldo tras el movimiento, o un guion en filas anteriores que no lo guardaban', () => {
    expect(toInventoryMovementHistoryVM(movement({ balanceAfter: 25 }), mxn).balanceText).toBe('25');
    expect(toInventoryMovementHistoryVM(movement({ balanceAfter: 0 }), mxn).balanceText).toBe('0');
    expect(toInventoryMovementHistoryVM(movement({ balanceAfter: null }), mxn).balanceText).toBe('—');
  });

  it('una entrada suma, se atribuye a la sucursal de destino y usa la etiqueta del motivo', () => {
    expect(toInventoryMovementHistoryVM(movement(), mxn)).toMatchObject({ signedQuantity: '+10', branchName: 'Centro', reasonLabel: 'Compra' });
  });

  it('una salida resta y se atribuye a la sucursal de origen', () => {
    const vm = toInventoryMovementHistoryVM(movement({ type: InventoryMovementType.OUT, reason: 'VENTA', quantity: 2, originBranchName: 'Norte', destinationBranchName: null }), mxn);

    expect(vm).toMatchObject({ signedQuantity: '-2', branchName: 'Norte', reasonLabel: 'Venta' });
  });

  it('un motivo que el front no conoce se muestra tal cual, y una sucursal ausente como guion', () => {
    const vm = toInventoryMovementHistoryVM(movement({ reason: 'MOTIVO_FUTURO', destinationBranchName: null }), mxn);

    expect(vm).toMatchObject({ reasonLabel: 'MOTIVO_FUTURO', branchName: '—' });
  });

  it('la fecha sale en la zona horaria de la tienda', () => {
    expect(toInventoryMovementHistoryVM(movement(), mxn).dateFormatted).toContain('05/11/2026');
  });

  it('un movimiento de un documento manual muestra su número, quién lo hizo y el comentario', () => {
    const vm = toInventoryMovementHistoryVM(movement({ reason: 'MERMA', document: { id: 'd', number: 'SAL-000004', comment: 'Se mojó', userName: 'Ana', kind: InventoryDocumentKind.EXIT, counterpartBranchName: null } }), mxn);

    expect(vm).toMatchObject({ documentNumber: 'SAL-000004', authorName: 'Ana', comment: 'Se mojó', reasonLabel: 'Merma o caducidad' });
  });

  it('un movimiento automático (venta, compra) no tiene documento', () => {
    expect(toInventoryMovementHistoryVM(movement(), mxn)).toMatchObject({ documentNumber: null, authorName: null, comment: null });
  });

  it('un traslado dice hacia dónde fue la salida y de dónde vino la entrada', () => {
    const document = { id: 'd', number: 'TRS-000001', comment: null, userName: 'Ana', kind: InventoryDocumentKind.TRANSFER };
    const out = toInventoryMovementHistoryVM(movement({ type: InventoryMovementType.OUT, reason: 'TRASLADO', originBranchName: 'Matriz', destinationBranchName: null, document: { ...document, counterpartBranchName: 'Norte' } }), mxn);
    const entry = toInventoryMovementHistoryVM(movement({ reason: 'TRASLADO', originBranchName: null, destinationBranchName: 'Norte', document: { ...document, counterpartBranchName: 'Matriz' } }), mxn);

    expect(out).toMatchObject({ branchName: 'Matriz', counterpartText: 'hacia Norte', reasonLabel: 'Traslado' });
    expect(entry).toMatchObject({ branchName: 'Norte', counterpartText: 'desde Matriz' });
  });

  it('sin traslado no hay texto de la otra sucursal', () => {
    expect(toInventoryMovementHistoryVM(movement(), mxn).counterpartText).toBeNull();
  });
});

describe('view-model de un documento abierto', () => {
  const line = (overrides: Partial<InventoryDocumentDetailEntity['lines'][number]> = {}): InventoryDocumentDetailEntity['lines'][number] => ({
    variantId: 'v1', sku: 'CAM-M', productName: 'Camisa', type: InventoryMovementType.IN, quantity: 6, branchName: 'Matriz', unitCost: 3.5, balanceAfter: 16, ...overrides,
  });
  const document = (overrides: Partial<InventoryDocumentDetailEntity> = {}): InventoryDocumentDetailEntity => ({
    id: 'd1', number: 'ENT-000001', kind: InventoryDocumentKind.ENTRY, reason: 'DONACION', comment: 'Regalo', createdAt: new Date('2026-11-05T18:30:00Z'), userName: 'Ana',
    branchName: 'Matriz', destinationBranchName: null, lines: [line(), line({ variantId: 'v2', sku: 'GOR-1', quantity: 4, unitCost: null, balanceAfter: null })], ...overrides,
  });

  it('una entrada: tipo, motivo con su etiqueta, líneas con signo, costo con moneda y un guion donde no hay dato', () => {
    const vm = toInventoryDocumentDetailVM(document(), mxn);

    expect(vm).toMatchObject({ kindLabel: 'Entrada de inventario', reasonLabel: 'Donación', productsText: '2 producto(s)', unitsText: '10 unidad(es)' });
    expect(vm.lines).toMatchObject([
      { signedQuantity: '+6', balanceText: '16', unitCostText: expect.stringContaining('3.50') as string },
      { unitCostText: '—', balanceText: '—' },
    ]);
  });

  it('una salida lleva el signo menos y el motivo elegido', () => {
    const vm = toInventoryDocumentDetailVM(document({ kind: InventoryDocumentKind.EXIT, reason: 'MERMA', lines: [line({ type: InventoryMovementType.OUT, quantity: 2 })] }), mxn);

    expect(vm).toMatchObject({ kindLabel: 'Salida de inventario', reasonLabel: 'Merma o caducidad' });
    expect(vm.lines).toMatchObject([{ signedQuantity: '-2' }]);
  });

  it('un traslado cuenta cada producto y cada unidad una sola vez (aunque tenga salida y entrada) y no muestra motivo', () => {
    const vm = toInventoryDocumentDetailVM(
      document({ kind: InventoryDocumentKind.TRANSFER, reason: 'TRASLADO', destinationBranchName: 'Norte', lines: [line({ type: InventoryMovementType.OUT, quantity: 4 }), line({ type: InventoryMovementType.IN, quantity: 4, branchName: 'Norte' })] }),
      mxn,
    );

    expect(vm).toMatchObject({ kindLabel: 'Traslado entre sucursales', reasonLabel: null, productsText: '1 producto(s)', unitsText: '4 unidad(es)' });
  });

  it('un conteo no muestra motivo y suma las unidades de sus líneas', () => {
    const vm = toInventoryDocumentDetailVM(document({ kind: InventoryDocumentKind.COUNT, reason: 'CONTEO_FISICO' }), mxn);

    expect(vm).toMatchObject({ kindLabel: 'Conteo físico', reasonLabel: null });
  });
});

describe('view-model de la lista de documentos', () => {
  const item = (overrides: Partial<InventoryDocumentListItemEntity> = {}): InventoryDocumentListItemEntity => ({
    id: 'd1', number: 'ENT-000001', kind: InventoryDocumentKind.ENTRY, reason: 'DONACION', comment: 'Regalo', createdAt: new Date('2026-11-05T18:30:00Z'), userName: 'Ana',
    branchName: 'Matriz', destinationBranchName: null, productsCount: 2, unitsCount: 16, ...overrides,
  });

  it('una entrada: tipo, motivo con su etiqueta, sucursal y totales', () => {
    expect(toInventoryDocumentListItemVM(item(), mxn)).toMatchObject({ kindLabel: 'Entrada de inventario', reasonLabel: 'Donación', branchText: 'Matriz', productsText: '2', unitsText: '16' });
  });

  it('un traslado muestra «origen → destino» y no tiene motivo', () => {
    expect(toInventoryDocumentListItemVM(item({ kind: InventoryDocumentKind.TRANSFER, reason: 'TRASLADO', destinationBranchName: 'Norte' }), mxn)).toMatchObject({ kindLabel: 'Traslado entre sucursales', reasonLabel: null, branchText: 'Matriz → Norte' });
  });

  it('un conteo tampoco muestra motivo', () => {
    expect(toInventoryDocumentListItemVM(item({ kind: InventoryDocumentKind.COUNT, reason: 'CONTEO_FISICO' }), mxn)).toMatchObject({ kindLabel: 'Conteo físico', reasonLabel: null });
  });
});
