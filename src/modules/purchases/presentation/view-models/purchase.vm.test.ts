import { describe, expect, it } from 'vitest';
import { createFormatters } from '@/shared/presentation/formatting/formatters';
import type { PurchaseEntity } from '../../domain/entities/purchase.entity';
import { supplierDisplayText, toPurchaseVM } from './purchase.vm';

const fmt = createFormatters({ currencyCode: 'USD', locale: 'es-EC', timezone: 'America/Guayaquil' });

const purchase: PurchaseEntity = {
  id: 'p', invoiceNumber: '', createdAt: '2026-01-02T15:00:00Z', status: 'COMPLETED', totalAmount: 12.5, isCancellable: true,
  supplierName: '', supplierIdentity: '', branchName: '', branchId: 'b', totalUnits: 1,
  items: [{ id: 'i', variantId: 'v', sku: '', productName: '', quantity: 1, purchasePrice: 12.5, unitCost: 12.5, subtotal: 12.5 }],
};

describe('purchase view-model', () => {
  it('rellena textos por defecto y da formato de la tienda', () => {
    const vm = toPurchaseVM(purchase, fmt);
    expect(vm.invoiceNumber).toBe('S/Ref');
    expect(vm.supplierName).toBe('Proveedor General');
    expect(vm.totalFormatted).toBe(fmt.money(12.5));
    expect(vm.totalFormatted).toContain('12');
    expect(vm.items[0]).toMatchObject({ sku: 'S/SKU', productName: 'Producto Desconocido', unitCostFormatted: fmt.money(12.5) });
    expect(vm.dateFormatted).toBe(fmt.dateTime('2026-01-02T15:00:00Z'));
  });

  it('proveedor: nombre e identificación', () => {
    expect(supplierDisplayText({ id: 's', identityNumber: '', name: '', email: '', phone: '', address: '' })).toBe('Sin Nombre (S/N)');
  });
});
