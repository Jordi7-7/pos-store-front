import type { CashSessionDetails } from '../../types/cash-sessions.types';

/** Puerto de salida: cerrar un turno y leer su resumen (la implementación va en `infrastructure`). */
export interface CashSessionsGateway {
  close(sessionId: string, closingBalance: number): Promise<void>;
  getDetails(sessionId: string): Promise<CashSessionDetails>;
}
