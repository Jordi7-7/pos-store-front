import { describe, expect, it } from 'vitest';
import { createFormatters } from '@/shared/presentation/formatting/formatters';
import { PaymentMethod, SaleStatus } from '../../domain/enums';
import type { SaleDetailEntity } from '../../domain/entities/sale.entity';
import { SALE_STATUS_BADGE, toSaleDetailVM, toSaleSummaryVM, toTicketSaleData } from './sale.vm';

const mxn = createFormatters({ currencyCode: 'MXN', locale: 'es-MX', timezone: 'America/Mexico_City' });
const eur = createFormatters({ currencyCode: 'EUR', locale: 'es-ES', timezone: 'Europe/Madrid' });

const sale: SaleDetailEntity = {
  id: 's1',
  invoiceNumber: '001-001-000000001',
  createdAt: new Date('2026-11-05T18:30:00Z'),
  total: 1234.5,
  subtotal: 1300,
  discountAmount: 65.5,
  status: SaleStatus.COMPLETED,
  branchName: 'Centro',
  customerName: 'Ana',
  userName: 'Cajero',
  items: [{ saleItemId: 'i', variantId: 'v', productName: 'Camisa', sku: 'A', attributes: '', quantity: 1, refundedQty: 0, refundableQty: 1, price: 1300, cost: 500, discountAmount: 65.5, lineTotal: 1234.5 }],
  payments: [{ paymentMethod: PaymentMethod.TARJETA, amount: 1234.5 }],
  refunds: [{ id: 'r', createdAt: new Date('2026-11-05T19:00:00Z'), reason: 'x', totalRefunded: 100, items: [{ id: 'ri', variantId: 'v', sku: 'A', productName: 'Camisa', quantity: 1, priceRefunded: 100 }] }],
  totalPieces: 1,
};

describe('view-models de venta', () => {
  it('los importes y fechas salen con la moneda, el idioma y la zona de la tienda', () => {
    const vm = toSaleDetailVM(sale, mxn);
    expect(vm).toMatchObject({ totalFormatted: '$1,234.50', subtotalFormatted: '$1,300.00', discountAmountFormatted: '$65.50' });
    expect(vm.items[0]).toMatchObject({ priceFormatted: '$1,300.00', lineTotalFormatted: '$1,234.50' });
    expect(vm.payments[0]?.amountFormatted).toBe('$1,234.50');
    expect(vm.refunds[0]).toMatchObject({ totalRefundedFormatted: '$100.00' });
    expect(vm.refunds[0]?.items[0]?.priceRefundedFormatted).toBe('$100.00');
    expect(vm.dateFormatted).toMatch(/05\/11\/2026/);
  });

  it('cambiar la moneda de la tienda cambia los textos sin tocar los datos', () => {
    const vm = toSaleDetailVM(sale, eur);
    expect(vm.total).toBe(1234.5);
    expect(vm.totalFormatted).toContain('€');
    expect(vm.totalFormatted).not.toContain('$');
  });

  it('el resumen de la lista usa el mismo formato (antes usaba el idioma del navegador)', () => {
    const vm = toSaleSummaryVM({ id: 's', invoiceNumber: '1', createdAt: sale.createdAt, total: 10, discountAmount: 0, status: SaleStatus.REFUNDED, customerName: 'Ana', branchName: 'Centro' }, mxn);
    expect(vm).toMatchObject({ totalFormatted: '$10.00', discountAmountFormatted: '$0.00' });
    expect(SALE_STATUS_BADGE[vm.status].label).toBe('Devuelta');
  });

  it('el ticket lleva la fecha en el formato de la tienda y los datos de la venta', () => {
    const ticket = toTicketSaleData(sale, mxn);
    expect(ticket).toMatchObject({ invoiceNumber: '001-001-000000001', total: 1234.5, paymentMethod: PaymentMethod.TARJETA, clientIdentity: '9999999999' });
    expect(ticket.createdAt).toMatch(/05\/11\/2026/);
  });

  it('todos los estados de venta tienen etiqueta', () => {
    for (const status of Object.values(SaleStatus)) expect(SALE_STATUS_BADGE[status].label).toBeTruthy();
  });
});
