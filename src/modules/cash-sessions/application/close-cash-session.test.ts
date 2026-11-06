import { describe, expect, it, vi } from 'vitest';
import { CloseCashSession, CloseCashSessionError } from './close-cash-session';
import type { CashSessionsRepository } from './ports/cash-sessions.repository';
import type { CashSessionDetails } from '../domain/session-types';

const details = { session: { id: 's1' } } as unknown as CashSessionDetails;

function setup(overrides: Partial<CashSessionsRepository> = {}) {
  const repository: CashSessionsRepository = {
    close: vi.fn(async () => undefined),
    getDetails: vi.fn(async () => details),
    ...overrides,
  };
  return { repository, useCase: new CloseCashSession(repository) };
}

describe('CloseCashSession', () => {
  it('cierra con el efectivo contado y devuelve el resumen real del turno', async () => {
    const { repository, useCase } = setup();
    expect(await useCase.execute({ sessionId: 's1', countedCash: '100.50' })).toEqual({ details });
    expect(repository.close).toHaveBeenCalledWith('s1', 100.5);
  });

  it.each(['', '  ', 'abc', '-5'])('no llama al servidor con un efectivo contado inválido (%j)', async (countedCash) => {
    const { repository, useCase } = setup();
    await expect(useCase.execute({ sessionId: 's1', countedCash })).rejects.toBeInstanceOf(CloseCashSessionError);
    expect(repository.close).not.toHaveBeenCalled();
  });

  it('contar 0 es válido (caja vacía)', async () => {
    const { repository, useCase } = setup();
    await useCase.execute({ sessionId: 's1', countedCash: '0' });
    expect(repository.close).toHaveBeenCalledWith('s1', 0);
  });

  it('si el resumen no se puede leer, el cierre sigue siendo válido y no se inventan datos', async () => {
    const { useCase } = setup({ getDetails: vi.fn(async () => Promise.reject(new Error('403'))) });
    expect(await useCase.execute({ sessionId: 's1', countedCash: '100' })).toEqual({ details: null });
  });

  it('si el servidor rechaza el cierre, el error llega tal cual y no se lee el resumen', async () => {
    const { repository, useCase } = setup({ close: vi.fn(async () => Promise.reject(new Error('VALIDATION_FAILED'))) });
    await expect(useCase.execute({ sessionId: 's1', countedCash: '100' })).rejects.toThrow('VALIDATION_FAILED');
    expect(repository.getDetails).not.toHaveBeenCalled();
  });
});
