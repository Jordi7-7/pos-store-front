import { apiClient } from '@/lib/apiClient';
import type { CashRegistersRepository, CreateCashRegisterInput, UpdateCashRegisterInput } from '../application/ports/cash-registers.repository';
import type { CashRegisterEntity, MyCashRegisterEntity } from '../domain/cash-register.entity';

/**
 * Cajas registradoras por HTTP. La API ya responde con la forma de la entidad (sin importes ni
 * textos que formatear), así que no hace falta un mapper intermedio.
 */
export class CashRegistersHttpRepository implements CashRegistersRepository {
  listMine(branchId?: string): Promise<MyCashRegisterEntity[]> {
    return apiClient.get<MyCashRegisterEntity[]>(branchId ? `/cash-registers/me?branchId=${branchId}` : '/cash-registers/me');
  }

  list(branchId?: string): Promise<CashRegisterEntity[]> {
    return apiClient.get<CashRegisterEntity[]>(branchId ? `/cash-registers?branchId=${branchId}` : '/cash-registers');
  }

  create(input: CreateCashRegisterInput): Promise<CashRegisterEntity> {
    return apiClient.post<CashRegisterEntity>('/cash-registers', input);
  }

  update(id: string, input: UpdateCashRegisterInput): Promise<CashRegisterEntity> {
    return apiClient.put<CashRegisterEntity>(`/cash-registers/${id}`, input);
  }

  async assignUsers(id: string, userIds: string[]): Promise<void> {
    await apiClient.put(`/cash-registers/${id}/assign-users`, { userIds });
  }
}
