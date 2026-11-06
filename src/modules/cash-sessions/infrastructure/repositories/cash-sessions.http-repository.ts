import { apiClient } from '@/lib/apiClient';
import type { CashSessionsRepository, OpenCashSessionInput, RegisterExpenseInput } from '../../application/ports/cash-sessions.repository';
import type { ActiveCashSessionEntity, CashSessionDetailsEntity, CashSessionHeaderEntity } from '../../domain/entities/cash-session.entity';
import type { ActiveCashSessionDTO, CashSessionDetails, CashSessionHeader } from '../dtos/cash-session.dto';
import { toActiveCashSessionEntity, toCashSessionDetailsEntity, toCashSessionHeaderEntities } from '../mappers/cash-session.mapper';

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

  async getActive(branchId?: string, cashRegisterId?: string): Promise<ActiveCashSessionEntity | null> {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    if (cashRegisterId) params.append('cashRegisterId', cashRegisterId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    // Sin turno abierto el servidor devuelve vacío
    const dto = await apiClient.get<ActiveCashSessionDTO | null>(`/sales/cash-sessions/active${queryString}`);
    return dto && dto.id ? toActiveCashSessionEntity(dto) : null;
  }

  async open(input: OpenCashSessionInput): Promise<ActiveCashSessionEntity> {
    return toActiveCashSessionEntity(await apiClient.post<ActiveCashSessionDTO>('/sales/cash-sessions/open', input));
  }

  async registerExpense(input: RegisterExpenseInput): Promise<void> {
    await apiClient.post('/sales/expenses', input);
  }
}
