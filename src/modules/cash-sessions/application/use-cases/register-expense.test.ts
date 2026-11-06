import { describe, expect, it, vi } from 'vitest';
import { RegisterExpense } from './register-expense';

const setup = () => {
  const registerExpense = vi.fn(async () => undefined);
  return { registerExpense, useCase: new RegisterExpense({ registerExpense }) };
};
const base = { branchId: 'b1', cashSessionId: 's1', description: '  Hielo ', amount: '20.5', category: 'Servicios' };

describe('RegisterExpense', () => {
  it('registra el gasto con la descripción recortada y el importe como número', async () => {
    const { registerExpense, useCase } = setup();
    await useCase.execute(base);
    expect(registerExpense).toHaveBeenCalledWith({ branchId: 'b1', cashSessionId: 's1', description: 'Hielo', amount: 20.5, category: 'Servicios' });
  });

  it.each([
    [{ ...base, branchId: null }, 'BRANCH_REQUIRED'],
    [{ ...base, description: '   ' }, 'DESCRIPTION_REQUIRED'],
    [{ ...base, amount: '' }, 'INVALID_EXPENSE_AMOUNT'],
    [{ ...base, amount: '0' }, 'INVALID_EXPENSE_AMOUNT'],
    [{ ...base, amount: '-3' }, 'INVALID_EXPENSE_AMOUNT'],
  ] as const)('no llama al servidor con datos inválidos (%o → %s)', async (command, code) => {
    const { registerExpense, useCase } = setup();
    await expect(useCase.execute(command)).rejects.toMatchObject({ code });
    expect(registerExpense).not.toHaveBeenCalled();
  });
});
