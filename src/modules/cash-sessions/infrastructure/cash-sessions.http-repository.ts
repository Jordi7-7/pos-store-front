import { apiClient } from '@/lib/apiClient';
import type { CashSessionsRepository } from '../application/ports/cash-sessions.repository';
import type { CashSessionDetailsEntity, CashSessionHeaderEntity } from '../domain/entities/cash-session.entity';
import type { CashSessionDetails, CashSessionHeader } from './dtos/cash-session.dto';
import { toCashSessionDetailsEntity, toCashSessionHeaderEntities } from './mappers/cash-session.mapper';

/** Turnos de caja por HTTP: convierte las respuestas (DTO) en entidades del dominio. */
export class CashSessionsHttpRepository implements CashSessionsRepository {
  async list(branchId?: string): Promise<CashSessionHeaderEntity[]> {
    const url = branchId ? `/sales/cash-sessions?branchId=${branchId}` : '/sales/cash-sessions';
    return toCashSessionHeaderEntities(await apiClient.get<CashSessionHeader[]>(url));
  }

  async getDetails(sessionId: string): Promise<CashSessionDetailsEntity> {
    return toCashSessionDetailsEntity(await apiClient.get<CashSessionDetails>(`/sales/cash-sessions/${sessionId}/details`));
  }

  async close(sessionId: string, closingBalance: number): Promise<void> {
    await apiClient.post(`/sales/cash-sessions/${sessionId}/close`, { closingBalance });
  }
}
