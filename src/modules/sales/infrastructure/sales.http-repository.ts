import { apiClient } from '@/lib/apiClient';
import { toActiveCashSessionEntity } from '@/modules/cash-sessions/infrastructure/mappers/cash-session.mapper';
import type { ActiveCashSessionDTO } from '@/modules/cash-sessions/infrastructure/dtos/cash-session.dto';
import type {
  OpenCashSessionInput,
  ProcessRefundInput,
  ProcessSaleInput,
  RegisterExpenseInput,
  SaleReceipt,
  SalesPage,
  SalesQuery,
  SalesRepository,
} from '../application/ports/sales.repository';
import type { ActiveCashSessionEntity } from '@/modules/cash-sessions/domain/entities/cash-session.entity';
import type { SaleDetailEntity } from '../domain/entities/sale.entity';
import type { PaginatedSalesDTO, SaleDetailDTO } from './dtos/sales.dto';
import { toSaleDetailEntity, toSaleSummaryEntities } from './mappers/sale.mapper';

/** Ventas y turnos de caja por HTTP: convierte las respuestas (DTO) en entidades del dominio. */
export class SalesHttpRepository implements SalesRepository {
  async processSale(input: ProcessSaleInput): Promise<SaleReceipt> {
    return apiClient.post<SaleReceipt>('/sales', input);
  }

  async list(query: SalesQuery): Promise<SalesPage> {
    const params = new URLSearchParams();
    if (query.startDate) params.set('startDate', query.startDate);
    if (query.endDate) params.set('endDate', query.endDate);
    if (query.branchId) params.set('branchId', query.branchId);
    params.set('page', String(query.page || 1));
    params.set('limit', String(query.limit || 10));
    const response = await apiClient.get<PaginatedSalesDTO>(`/sales/paginated?${params.toString()}`);
    return { items: toSaleSummaryEntities(response.data), meta: response.meta };
  }

  async getByInvoice(invoiceNumber: string): Promise<SaleDetailEntity> {
    return toSaleDetailEntity(await apiClient.get<SaleDetailDTO>(`/sales/invoice/${encodeURIComponent(invoiceNumber)}`));
  }

  async openCashSession(input: OpenCashSessionInput): Promise<ActiveCashSessionEntity> {
    return toActiveCashSessionEntity(await apiClient.post<ActiveCashSessionDTO>('/sales/cash-sessions/open', input));
  }

  async getActiveCashSession(branchId?: string, cashRegisterId?: string): Promise<ActiveCashSessionEntity | null> {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    if (cashRegisterId) params.append('cashRegisterId', cashRegisterId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    // Sin turno abierto el servidor devuelve vacío
    const dto = await apiClient.get<ActiveCashSessionDTO | null>(`/sales/cash-sessions/active${queryString}`);
    return dto && dto.id ? toActiveCashSessionEntity(dto) : null;
  }

  async registerExpense(input: RegisterExpenseInput): Promise<void> {
    await apiClient.post('/sales/expenses', input);
  }

  async processRefund(input: ProcessRefundInput): Promise<void> {
    await apiClient.post('/sales/refunds', input);
  }
}
