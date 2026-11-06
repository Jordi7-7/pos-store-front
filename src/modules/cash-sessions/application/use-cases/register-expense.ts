import { parsePositiveMoneyInput } from '@/shared/domain/money-input';
import { CashSessionError } from '../errors/cash-session-error';
import type { CashSessionsRepository } from '../ports/cash-sessions.repository';

export interface RegisterExpenseCommand {
  branchId: string | null;
  cashSessionId?: string;
  description: string;
  /** Importe tal como se escribió. */
  amount: string;
  category: string;
}

/** Registrar un gasto (salida de efectivo) del turno: exige descripción e importe mayor que cero. */
export class RegisterExpense {
  constructor(private readonly repository: Pick<CashSessionsRepository, 'registerExpense'>) {}

  async execute(command: RegisterExpenseCommand): Promise<void> {
    if (!command.branchId) throw new CashSessionError('BRANCH_REQUIRED', 'Por favor selecciona una sucursal activa.');
    const description = command.description.trim();
    if (!description) throw new CashSessionError('DESCRIPTION_REQUIRED', 'Por favor ingresa una descripción para el gasto.');
    const amount = parsePositiveMoneyInput(command.amount);
    if (amount === null) throw new CashSessionError('INVALID_EXPENSE_AMOUNT', 'Por favor ingresa un monto válido.');

    await this.repository.registerExpense({
      branchId: command.branchId,
      cashSessionId: command.cashSessionId,
      description,
      amount,
      category: command.category,
    });
  }
}
