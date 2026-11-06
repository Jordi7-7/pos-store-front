import { describe, expect, it } from 'vitest';
import { CashSessionStatus } from '@/modules/cash-sessions/domain/enums';
import type { ClosingTicketData } from '@/modules/cash-sessions/domain/closing-ticket';
import { PaymentMethod } from '../../domain/enums';
import type { TicketSaleData } from '../../domain/ticket';
import { buildClosingReceiptBytes, buildSaleReceiptBytes } from './escpos-builder';

/** Los comandos ESC/POS son bytes de control; el texto es ASCII/CP850, así que se lee como latin1. */
const textOf = (bytes: Uint8Array): string => new TextDecoder('latin1').decode(bytes);

const sale: TicketSaleData = {
  invoiceNumber: '001-001-000000001',
  createdAt: '05/11/2026 10:00',
  branchName: 'Sucursal Centro',
  clientName: 'Consumidor Final',
  items: [{ productName: 'Camisa', variantSku: 'CAM-1', quantity: 2, price: 1234.5 }],
  paymentMethod: PaymentMethod.EFECTIVO,
  subtotal: 2469,
  total: 2469,
};

const closing: ClosingTicketData = {
  id: 's1',
  branchName: 'Sucursal Centro',
  cashRegisterName: 'Caja 1',
  userName: 'Cajero',
  openedAt: '2026-11-05T10:00:00Z',
  closedAt: '2026-11-05T18:00:00Z',
  openingBalance: 100,
  closingBalance: 100,
  expectedBalance: 100,
  salesTotal: 0,
  expensesTotal: 0,
  paymentsBreakdown: {},
  refundsList: [],
  salesList: [],
  expensesList: [],
  productsList: [],
  status: CashSessionStatus.CLOSED,
};

const build = (currencyCode: string, locale: string) =>
  textOf(buildSaleReceiptBytes(sale, { format: { currencyCode, locale }, openDrawer: false, cutPaper: false }));

describe('ticket de venta: los importes salen con la moneda de la tienda', () => {
  it('MXN: $2,469.00 con coma de miles y punto decimal', () => {
    const text = build('MXN', 'es-MX');
    expect(text).toContain('$2,469.00');
    expect(text).toContain('$1,234.50');
  });

  it('USD en Ecuador: punto de miles y coma decimal, no el formato de México', () => {
    const text = build('USD', 'es-EC');
    expect(text).toMatch(/\$\s?2\.469,00/);
    expect(text).not.toContain('$2,469.00');
  });

  it('EUR: sin el símbolo € (la impresora no lo tiene) y sin ningún $', () => {
    const text = build('EUR', 'es-ES');
    expect(text).toContain('EUR');
    expect(text).not.toContain('$');
  });

  it('la cantidad en letras usa la moneda de la tienda, no una por defecto', () => {
    expect(build('MXN', 'es-MX')).toMatch(/SESENTA Y NUEVE MXN 00\/100/);
    expect(build('COP', 'es-CO')).toMatch(/SESENTA Y NUEVE COP 00\/100/);
  });
});

describe('ticket de cierre: los importes salen con la moneda de la tienda', () => {
  it('MXN y COP no mezclan formatos ni símbolos fijos', () => {
    const mxn = textOf(buildClosingReceiptBytes(closing, { format: { currencyCode: 'MXN', locale: 'es-MX' }, openDrawer: false, cutPaper: false }));
    expect(mxn).toContain('$100.00');
    const eur = textOf(buildClosingReceiptBytes(closing, { format: { currencyCode: 'EUR', locale: 'es-ES' }, openDrawer: false, cutPaper: false }));
    expect(eur).toContain('EUR');
    expect(eur).not.toContain('$');
  });
});
