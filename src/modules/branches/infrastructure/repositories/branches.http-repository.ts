import { apiClient } from '@/lib/apiClient';
import type { BranchesRepository, CreateBranchInput, UpdateBranchInput } from '../../application/ports/branches.repository';
import type { Branch } from '../../domain/entities/branch.entity';

/** Sucursales por HTTP. La API ya responde con la forma de la entidad, sin textos que formatear. */
export class BranchesHttpRepository implements BranchesRepository {
  list(): Promise<Branch[]> {
    return apiClient.get<Branch[]>('/branches');
  }

  create(input: CreateBranchInput): Promise<Branch> {
    return apiClient.post<Branch>('/branches', input);
  }

  update(id: string, input: UpdateBranchInput): Promise<Branch> {
    return apiClient.put<Branch>(`/branches/${id}`, input);
  }
}
