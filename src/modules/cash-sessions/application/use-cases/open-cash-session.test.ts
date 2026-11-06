import { describe, expect, it, vi } from 'vitest';
import { CashSessionError } from '../errors/cash-session-error';
import { OpenCashSession } from './open-cash-session';
import type { ActiveCashSessionEntity } from '../../domain/entities/cash-session.entity';

const session = { id: 'a' } as ActiveCashSessionEntity;
const setup = () => {
  const open = vi.fn(async () => session);
  return { open, useCase: new OpenCashSession({ open }) };
};

describe('OpenCashSession', () => {
  it('abre con el fondo inicial escrito, como número', async () => {
    const { open, useCase } = setup();
    expect(await useCase.execute({ branchId: 'b1', cashRegisterId: 'c1', openingBalance: '1000.50' })).toBe(session);
    expect(open).toHaveBeenCalledWith({ branchId: 'b1', cashRegisterId: 'c1', openingBalance: 1000.5 });
  });

  it('un fondo vacío cuenta como 0 (caja sin fondo)', async () => {
    const { open, useCase } = setup();
    await useCase.execute({ branchId: 'b1', cashRegisterId: 'c1', openingBalance: '  ' });
    expect(open).toHaveBeenCalledWith({ branchId: 'b1', cashRegisterId: 'c1', openingBalance: 0 });
  });

  it.each([
    [{ branchId: null, cashRegisterId: 'c', openingBalance: '1' }, 'BRANCH_REQUIRED'],
    [{ branchId: 'b', cashRegisterId: null, openingBalance: '1' }, 'REGISTER_REQUIRED'],
    [{ branchId: 'b', cashRegisterId: 'c', openingBalance: '-5' }, 'INVALID_OPENING_BALANCE'],
    [{ branchId: 'b', cashRegisterId: 'c', openingBalance: 'abc' }, 'INVALID_OPENING_BALANCE'],
  ] as const)('rechaza lo inválido antes de llamar al servidor (%j → %s)', async (command, code) => {
    const { open, useCase } = setup();
    await expect(useCase.execute(command)).rejects.toMatchObject({ code });
    await expect(useCase.execute(command)).rejects.toBeInstanceOf(CashSessionError);
    expect(open).not.toHaveBeenCalled();
  });
});
