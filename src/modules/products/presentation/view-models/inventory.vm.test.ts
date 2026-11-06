import { describe, expect, it } from 'vitest';
import { createFormatters } from '@/shared/presentation/formatting/formatters';
import { BatchStatus } from '../../domain/enums';
import type { InventoryLotEntity } from '../../domain/entities/inventory.entity';
import { toInventoryLotVM } from './inventory.vm';

const mxn = createFormatters({ currencyCode: 'MXN', locale: 'es-MX', timezone: 'America/Mexico_City' });

const lot = (overrides: Partial<InventoryLotEntity> = {}): InventoryLotEntity => ({
  id: 'l', purchaseOrderId: 'abcdef1234567', createdAt: new Date('2026-11-05T18:30:00Z'), branchId: 'b', branchName: 'Centro', originType: 'PURCHASE',
  originName: 'Compra', originReference: '', totalInitialQuantity: 100, totalRemainingQuantity: 40, hasStock: true, percentRemaining: 40,
  totalCostValue: 1234.5, totalInitialCostValue: 3000, status: BatchStatus.ACTIVE, items: [], ...overrides,
});

describe('view-model de lote', () => {
  it('importes con la moneda de la tienda y fecha numérica', () => {
    const vm = toInventoryLotVM(lot(), mxn);
    expect(vm).toMatchObject({ totalCostFormatted: '$1,234.50', totalInitialCostFormatted: '$3,000.00', dateFormatted: '05/11/2026', percentDisplay: 40 });
  });

  it('el título es la referencia de origen o uno por defecto', () => {
    expect(toInventoryLotVM(lot({ originReference: 'FAC-1' }), mxn).displayTitle).toBe('FAC-1');
    expect(toInventoryLotVM(lot(), mxn).displayTitle).toBe('Lote Compra #abcdef12');
    expect(toInventoryLotVM(lot({ purchaseOrderId: null }), mxn).displayTitle).toBe('Lote Inventario Directo');
  });

  it('un lote casi intacto muestra un decimal para no parecer 100 %', () => {
    expect(toInventoryLotVM(lot({ totalRemainingQuantity: 99, percentRemaining: 99.4 }), mxn).percentDisplay).toBe('99.4');
    expect(toInventoryLotVM(lot({ totalRemainingQuantity: 100, percentRemaining: 100 }), mxn).percentDisplay).toBe(100);
  });
});
