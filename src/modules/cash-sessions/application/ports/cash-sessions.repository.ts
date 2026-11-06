import type { CashSessionDetails } from '../../types/cash-sessions.types';

/** Puerto de salida: cerrar un turno y leer su resumen (la implementación va en `infrastructure`). */
export interface CashSessionsRepository {
  close(sessionId: string, closingBalance: number): Promise<void>;
  getDetails(sessionId: string): Promise<CashSessionDetails>;
}
