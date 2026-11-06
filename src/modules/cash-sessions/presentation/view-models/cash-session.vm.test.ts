import { describe, expect, it } from 'vitest';
import { createFormatters } from '@/shared/presentation/formatting/formatters';
import { PaymentMethod, SaleStatus } from '@/shared/domain/enums/payments';
import { CashSessionDifferenceStatus, CashSessionStatus } from '../../domain/enums';
import type { CashSessionDetailsEntity, CashSessionHeaderEntity } from '../../domain/entities/cash-session.entity';
import { toCashSessionDetailsVM, toCashSessionHeaderVM } from './cash-session.vm';

const mxn = createFormatters({ currencyCode: 'MXN', locale: 'es-MX', timezone: 'America/Mexico_City' });
const eur = createFormatters({ currencyCode: 'EUR', locale: 'es-ES', timezone: 'Europe/Madrid' });

const header = (overrides: Partial<CashSessionHeaderEntity> = {}): CashSessionHeaderEntity => ({
  id: 's1',
  openingBalance: 100,
  closingBalance: 100,
  expectedBalance: 100,
  difference: 0,
  differenceStatus: CashSessionDifferenceStatus.EXACT,
  status: CashSessionStatus.CLOSED,
  isClosed: true,
  openedAt: '2026-11-05T16:00:00Z',
  closedAt: '2026-11-05T18:15:00Z',
  openedByName: 'Cajero',
  branchName: 'Centro',
  branchAddress: '',
  cashRegisterName: 'Caja 1',
  cashRegisterCode: '1',
  totalSales: 310,
  ...overrides,
});

describe('view-model del turno', () => {
  it('los importes salen con la moneda de la tienda, también el cuadre exacto (antes llevaba "$0.00" fijo)', () => {
    expect(toCashSessionHeaderVM(header(), mxn).differenceStatusText).toBe('Exacto ($0.00)');
    const eurText = toCashSessionHeaderVM(header(), eur).differenceStatusText;
    expect(eurText).toMatch(/^Exacto \(/);
    expect(eurText).toContain('€');
    expect(eurText).not.toContain('$');
  });

  it('sobrante y faltante muestran el importe con signo y en la moneda de la tienda', () => {
    expect(toCashSessionHeaderVM(header({ difference: 5.5, differenceStatus: CashSessionDifferenceStatus.SURPLUS }), mxn).differenceStatusText).toBe('Sobran +$5.50');
    expect(toCashSessionHeaderVM(header({ difference: -3, differenceStatus: CashSessionDifferenceStatus.SHORTAGE }), mxn).differenceStatusText).toBe('Faltan -$3.00');
  });

  it('turno abierto: en curso, sin cierre, duración hasta ahora', () => {
    const vm = toCashSessionHeaderVM(header({ status: CashSessionStatus.OPEN, isClosed: false, closedAt: null, closingBalance: null, difference: null, differenceStatus: CashSessionDifferenceStatus.PENDING }), mxn);
    expect(vm.differenceStatusText).toBe('En turno');
    expect(vm.closedAtFormatted).toBe('Sesión activa');
    expect(vm.timeRangeFormatted).toMatch(/^Desde .* \(En curso\)$/);
  });

  it('la hora está en la zona de la tienda y la duración es la del turno', () => {
    const vm = toCashSessionHeaderVM(header(), mxn);
    expect(vm.openTimeFormatted).toMatch(/10:00/); // 16:00Z en México (UTC-6)
    expect(vm.durationFormatted).toBe('2h 15m');
  });

  it('detalle: importes con signo en gastos y devoluciones, etiquetas en singular/plural y estado de venta', () => {
    const entity: CashSessionDetailsEntity = {
      session: header(),
      kpis: { grossSales: 310, netSales: 0, cashSales: 310, cardSales: 0, totalExpenses: 20, totalRefunds: 310, salesCount: 1, expensesCount: 1, refundsCount: 2 },
      sales: [
        {
          id: 'v1', invoiceNumber: '001-001-000000001', createdAt: '2026-11-05T17:00:00Z', userName: 'Cajero', customerName: 'X', customerIdentity: '1',
          totalItems: 1, status: SaleStatus.PARTIALLY_REFUNDED, subtotal: 310, discountAmount: 0, itemsDiscountAmount: 0, globalDiscountAmount: 0, total: 310,
          paymentMethod: PaymentMethod.EFECTIVO, payments: [{ id: 'p', paymentMethod: 'EFECTIVO', amount: 310 }, { id: 'q', paymentMethod: 'TARJETA', amount: 0 }],
          items: [{ id: 'i', variantId: 'v', sku: 'A', productName: 'Camisa', combinationText: 'Estándar', attributeValues: [], quantity: 1, price: 310, subtotal: 310, discountAmount: 0, globalDiscountAmount: 0, total: 310 }],
        },
      ],
      expenses: [{ id: 'e', description: 'Hielo', amount: 20, createdAt: '2026-11-05T17:10:00Z', userName: 'Cajero', category: 'General' }],
      refunds: [{ id: 'r', reason: 'x', items: [], totalRefunded: 310, createdAt: '2026-11-05T17:20:00Z', userName: 'Cajero', invoiceNumber: '001' }],
    };
    const vm = toCashSessionDetailsVM(entity, mxn);
    expect(vm.kpis).toMatchObject({ totalExpensesFormatted: '-$20.00', totalRefundsFormatted: '-$310.00', expensesLabel: '1 salida', refundsLabel: '2 reembolsos' });
    expect(vm.sales[0]).toMatchObject({ statusLabel: 'Dev. Parcial', totalFormatted: '$310.00', paymentMethodsLabel: 'EFECTIVO/TARJETA' });
    expect(vm.sales[0]?.items[0]).toMatchObject({ priceFormatted: '$310.00', totalFormatted: '$310.00' });
    expect(vm.expenses[0]?.amountFormatted).toBe('-$20.00');
    expect(vm.refunds[0]?.totalRefundedFormatted).toBe('-$310.00');
  });
});
