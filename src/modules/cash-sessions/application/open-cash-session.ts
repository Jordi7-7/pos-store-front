import { parseMoneyInput } from '@/shared/domain/money-input';
import type { ActiveCashSessionEntity } from '../domain/entities/cash-session.entity';
import { CashSessionError } from './cash-session-error';
import type { CashSessionsRepository } from './ports/cash-sessions.repository';

export interface OpenCashSessionCommand {
  branchId: string | null;
  cashRegisterId: string | null;
  /** Fondo inicial tal como se escribió; vacío cuenta como 0. */
  openingBalance: string;
}

/** Abrir el turno de una caja: exige sucursal, caja y un fondo inicial válido (no negativo). */
export class OpenCashSession {
  constructor(private readonly repository: Pick<CashSessionsRepository, 'open'>) {}

  async execute(command: OpenCashSessionCommand): Promise<ActiveCashSessionEntity> {
    if (!command.branchId) throw new CashSessionError('BRANCH_REQUIRED', 'Por favor selecciona una sucursal activa.');
    if (!command.cashRegisterId) throw new CashSessionError('REGISTER_REQUIRED', 'Por favor selecciona una caja registradora.');

    const text = command.openingBalance.trim();
    const openingBalance = text === '' ? 0 : parseMoneyInput(text);
    if (openingBalance === null) throw new CashSessionError('INVALID_OPENING_BALANCE', 'Ingresa un fondo inicial válido (cero o más).');

    return this.repository.open({ branchId: command.branchId, cashRegisterId: command.cashRegisterId, openingBalance });
  }
}
