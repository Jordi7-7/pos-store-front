import { describe, expect, it } from 'vitest';
import { CashSessionDifferenceStatus, CashSessionStatus } from '../../domain/enums';
import type { ActiveCashSessionDTO, CashSessionDetails, CashSessionHeader } from '../dtos/cash-session.dto';
import { toActiveCashSessionEntity, toCashSessionDetailsEntity, toCashSessionHeaderEntity } from './cash-session.mapper';

const header = (overrides: Partial<CashSessionHeader> = {}) =>
  ({
    id: 's1', openingBalance: '100', closingBalance: 100, expectedBalance: 100, difference: 0, status: CashSessionStatus.CLOSED,
    openedAt: '2026-11-05T16:00:00Z', closedAt: '2026-11-05T18:00:00Z', ...overrides,
  }) as unknown as CashSessionHeader;

describe('mapper de turnos: solo convierte datos, no formatea', () => {
  it('convierte textos numéricos en números y no añade ningún campo de pantalla', () => {
    const entity = toCashSessionHeaderEntity(header());
    expect(entity.openingBalance).toBe(100);
    expect(Object.keys(entity).filter((key) => /Formatted|Label|Text$/.test(key))).toEqual([]);
  });

  it('el estado del cuadre sale de la diferencia (tolerancia de 5 centavos)', () => {
    const status = (difference: number | null, closed = true) =>
      toCashSessionHeaderEntity(header({ difference, status: closed ? CashSessionStatus.CLOSED : CashSessionStatus.OPEN })).differenceStatus;
    expect(status(0.04)).toBe(CashSessionDifferenceStatus.EXACT);
    expect(status(5)).toBe(CashSessionDifferenceStatus.SURPLUS);
    expect(status(-5)).toBe(CashSessionDifferenceStatus.SHORTAGE);
    expect(status(null)).toBe(CashSessionDifferenceStatus.EXACT);
    expect(status(5, false)).toBe(CashSessionDifferenceStatus.PENDING);
  });

  it('el detalle conserva lo que necesita el corte: atributos, subtotal y descuento global por línea, y los artículos devueltos', () => {
    const dto = {
      session: header(),
      kpis: { grossSales: 310, netSales: 0, cashSales: 310, cardSales: 0, totalExpenses: 0, totalRefunds: 310, salesCount: 1, expensesCount: 0, refundsCount: 1 },
      sales: [{
        id: 'v1', invoiceNumber: '001', createdAt: '2026-11-05T17:00:00Z', total: 310, status: 'COMPLETED', paymentMethod: 'EFECTIVO', payments: [], 
        items: [{ id: 'i', variantId: 'x', quantity: 2, price: 100, discountAmount: 10, globalDiscountAmount: 5, variant: { sku: 'A', product: { name: 'Camisa' }, attributeValues: [{ value: 'Rojo' }, { value: 'M' }] } }],
      }],
      expenses: [],
      refunds: [{ id: 'r', totalRefunded: 310, reason: 'x', createdAt: '2026-11-05T17:30:00Z', items: [{ quantity: 1, variant: { sku: 'A', product: { name: 'Camisa' } } }] }],
    } as unknown as CashSessionDetails;
    const entity = toCashSessionDetailsEntity(dto);
    expect(entity.sales[0]?.items[0]).toMatchObject({ attributeValues: ['Rojo', 'M'], subtotal: 200, discountAmount: 10, globalDiscountAmount: 5, total: 185 });
    expect(entity.refunds[0]?.items).toEqual([{ name: 'Camisa', sku: 'A', quantity: 1 }]);
  });

  it('el turno activo llega plano (/active) o anidado (/open) y produce la misma entidad', () => {
    const flat = { id: 'a', status: CashSessionStatus.OPEN, branchId: 'b', cashRegisterId: 'c', cashRegisterName: 'Caja 1', openingBalance: 100, openedAt: 'x', openedByName: 'Ana' } as ActiveCashSessionDTO;
    const nested = { id: 'a', status: CashSessionStatus.OPEN, branch: { id: 'b' }, cashRegister: { id: 'c', name: 'Caja 1' }, openingBalance: 100, openedAt: 'x', user: { name: 'Ana' } } as ActiveCashSessionDTO;
    expect(toActiveCashSessionEntity(nested)).toEqual(toActiveCashSessionEntity(flat));
    expect(toActiveCashSessionEntity(flat)).toMatchObject({ branchId: 'b', cashRegisterId: 'c', cashRegisterName: 'Caja 1', openedByName: 'Ana' });
  });
});
