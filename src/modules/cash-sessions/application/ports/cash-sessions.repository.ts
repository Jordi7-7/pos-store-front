import type { CashSessionDetailsEntity, CashSessionHeaderEntity } from '../../domain/entities/cash-session.entity';

/** Puerto de salida: turnos de caja en el servidor (la implementación va en `infrastructure`). */
export interface CashSessionsRepository {
  list(branchId?: string): Promise<CashSessionHeaderEntity[]>;
  getDetails(sessionId: string): Promise<CashSessionDetailsEntity>;
  close(sessionId: string, closingBalance: number): Promise<void>;
}
