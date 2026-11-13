import { describe, expect, it } from 'vitest';
import { PaymentMethod } from '@/shared/domain/enums/payments';
import type { ClosingTicketData, TicketSaleData } from '../../domain/entities/ticket';
import { buildCalibrationBytes, buildClosingReceiptBytes, buildSaleReceiptBytes } from './escpos-builder';
import { parseEscPosBytes } from './escpos-parser';

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
  isClosed: true,
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

describe('columnas y márgenes configurables', () => {
  const base = { format: { currencyCode: 'MXN', locale: 'es-MX' }, openDrawer: false, cutPaper: false } as const;
  const rowsOf = (bytes: Uint8Array, paperWidth: '58mm' | '80mm', columns?: number) =>
    parseEscPosBytes(bytes, paperWidth, columns).lines.map((l) => l.text);

  it('80 mm con 42 columnas: ninguna línea pasa de 42 (con 48 se partiría en la impresora)', () => {
    const bytes = buildSaleReceiptBytes(sale, { ...base, paperWidth: '80mm', columns: 42 });
    const parsed = parseEscPosBytes(bytes, '80mm', 42);
    expect(parsed.maxCols).toBe(42);
    expect(parsed.lines.some((l) => l.isOverflow)).toBe(false);
    expect(Math.max(...rowsOf(bytes, '80mm', 42).map((t) => t.length))).toBeLessThanOrEqual(42);
  });

  it('sin columnas configuradas, 80 mm sigue usando 48 como antes', () => {
    const bytes = buildSaleReceiptBytes(sale, { ...base, paperWidth: '80mm' });
    expect(Math.max(...rowsOf(bytes, '80mm').map((t) => t.length))).toBe(48);
  });

  it('el cierre de caja respeta las columnas configuradas', () => {
    const bytes = buildClosingReceiptBytes(closing, { ...base, paperWidth: '80mm', columns: 42 });
    expect(parseEscPosBytes(bytes, '80mm', 42).lines.some((l) => l.isOverflow)).toBe(false);
  });

  it('el margen izquierdo envía GS L con los puntos y el parser no lo toma por texto', () => {
    const bytes = buildSaleReceiptBytes(sale, { ...base, paperWidth: '80mm', leftMarginMm: 5 });
    const at = bytes.findIndex((b, i) => b === 0x1d && bytes[i + 1] === 0x4c);
    expect(at).toBeGreaterThan(-1);
    expect([bytes[at + 2], bytes[at + 3]]).toEqual([40, 0]);
    expect(rowsOf(bytes, '80mm').some((t) => t.includes('L('))).toBe(false);
  });

  it('sin margen no envía GS L', () => {
    const bytes = buildSaleReceiptBytes(sale, { ...base, paperWidth: '80mm' });
    expect(bytes.some((b, i) => b === 0x1d && bytes[i + 1] === 0x4c)).toBe(false);
  });

  it('las líneas antes del corte son configurables', () => {
    const cutAt = (b: Uint8Array) => b.findIndex((x, i) => x === 0x1d && b[i + 1] === 0x56);
    const feedBefore = (feedLines: number) => {
      const b = buildSaleReceiptBytes(sale, { ...base, cutPaper: true, feedLines });
      let n = 0;
      for (let i = cutAt(b) - 1; b[i] === 0x0a; i--) n++;
      return n;
    };
    // El último renglón del ticket ya termina en 0x0A: el avance configurado se suma a ese.
    expect(feedBefore(6) - feedBefore(0)).toBe(6);
  });

  it('la hoja de calibración trae una línea por largo, sin espacios, y el marco de las columnas', () => {
    const text = textOf(buildCalibrationBytes({ paperWidth: '80mm', columns: 42, cutPaper: false }));
    const lines = text.split('\n');
    for (const length of [32, 42, 48, 64]) {
      const line = lines.find((l) => l.startsWith(String(length) + '='));
      expect(line?.length).toBe(length);
    }
    expect(lines).toContain('|' + '='.repeat(40) + '|');
  });
});
