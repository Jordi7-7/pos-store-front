import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PaymentMethod } from '../../../domain/enums';

const warning = vi.hoisted(() => vi.fn());
vi.mock('sonner', () => ({ toast: { warning, error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

const { usePOSPayments } = await import('./usePOSPayments');

beforeEach(() => warning.mockReset());

describe('cobro exacto (atajo F8)', () => {
  it('añade de una vez lo que falta con el método elegido y deja la venta pagada', () => {
    const { result } = renderHook(() => usePOSPayments(310.1));
    act(() => result.current.setSelectedMethod(PaymentMethod.TARJETA));
    act(() => result.current.handleAddExactPayment());
    expect(result.current.addedPayments).toEqual([{ paymentMethod: PaymentMethod.TARJETA, amount: 310.1 }]);
    expect(result.current.remaining).toBe(0);
  });

  it('con un pago parcial, cobra solo el resto (sin errores de coma flotante)', () => {
    const { result } = renderHook(() => usePOSPayments(0.3));
    act(() => result.current.setCustomAmountText('0.1'));
    act(() => result.current.handleAddPayment());
    act(() => result.current.handleAddExactPayment());
    expect(result.current.addedPayments.map((p) => p.amount)).toEqual([0.1, 0.2]);
    expect(result.current.amountPaid).toBe(0.3);
  });

  it('si ya está pagada, avisa y no añade nada', () => {
    const { result } = renderHook(() => usePOSPayments(50));
    act(() => result.current.handleAddExactPayment());
    act(() => result.current.handleAddExactPayment());
    expect(result.current.addedPayments).toHaveLength(1);
    expect(warning).toHaveBeenCalledWith('La venta ya está totalmente pagada.');
  });

  it('con el carrito vacío (nada que cobrar) no añade ningún pago', () => {
    const { result } = renderHook(() => usePOSPayments(0));
    act(() => result.current.handleAddExactPayment());
    expect(result.current.addedPayments).toEqual([]);
  });
});
