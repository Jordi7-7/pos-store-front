import { describe, expect, it, vi } from 'vitest';
import { CloseCashSession, CloseCashSessionError } from './close-cash-session';
import type { CashSessionsGateway } from './ports/cash-sessions-gateway';
import type { CashSessionDetails } from '../types/cash-sessions.types';

const details = { session: { id: 's1' } } as unknown as CashSessionDetails;

function setup(overrides: Partial<CashSessionsGateway> = {}) {
  const gateway: CashSessionsGateway = {
    close: vi.fn(async () => undefined),
    getDetails: vi.fn(async () => details),
    ...overrides,
  };
  return { gateway, useCase: new CloseCashSession(gateway) };
}

describe('CloseCashSession', () => {
  it('cierra con el efectivo contado y devuelve el resumen real del turno', async () => {
    const { gateway, useCase } = setup();
    expect(await useCase.execute({ sessionId: 's1', countedCash: '100.50' })).toEqual({ details });
    expect(gateway.close).toHaveBeenCalledWith('s1', 100.5);
  });

  it.each(['', '  ', 'abc', '-5'])('no llama al servidor con un efectivo contado inválido (%j)', async (countedCash) => {
    const { gateway, useCase } = setup();
    await expect(useCase.execute({ sessionId: 's1', countedCash })).rejects.toBeInstanceOf(CloseCashSessionError);
    expect(gateway.close).not.toHaveBeenCalled();
  });

  it('contar 0 es válido (caja vacía)', async () => {
    const { gateway, useCase } = setup();
    await useCase.execute({ sessionId: 's1', countedCash: '0' });
    expect(gateway.close).toHaveBeenCalledWith('s1', 0);
  });

  it('si el resumen no se puede leer, el cierre sigue siendo válido y no se inventan datos', async () => {
    const { useCase } = setup({ getDetails: vi.fn(async () => Promise.reject(new Error('403'))) });
    expect(await useCase.execute({ sessionId: 's1', countedCash: '100' })).toEqual({ details: null });
  });

  it('si el servidor rechaza el cierre, el error llega tal cual y no se lee el resumen', async () => {
    const { gateway, useCase } = setup({ close: vi.fn(async () => Promise.reject(new Error('VALIDATION_FAILED'))) });
    await expect(useCase.execute({ sessionId: 's1', countedCash: '100' })).rejects.toThrow('VALIDATION_FAILED');
    expect(gateway.getDetails).not.toHaveBeenCalled();
  });
});
