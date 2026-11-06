import type { ActiveCashSessionEntity, CashSessionDetailsEntity, CashSessionHeaderEntity } from '../../domain/entities/cash-session.entity';

export interface OpenCashSessionInput {
  branchId: string;
  cashRegisterId: string;
  openingBalance: number;
}

export interface RegisterExpenseInput {
  branchId: string;
  cashSessionId?: string;
  description: string;
  amount: number;
  category: string;
}

/** Puerto de salida: turnos de caja en el servidor (la implementación va en `infrastructure`). */
export interface CashSessionsRepository {
  list(branchId?: string): Promise<CashSessionHeaderEntity[]>;
  getDetails(sessionId: string): Promise<CashSessionDetailsEntity>;
  getActive(branchId?: string, cashRegisterId?: string): Promise<ActiveCashSessionEntity | null>;
  open(input: OpenCashSessionInput): Promise<ActiveCashSessionEntity>;
  close(sessionId: string, closingBalance: number): Promise<void>;
  registerExpense(input: RegisterExpenseInput): Promise<void>;
}
