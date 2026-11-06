import type { Branch } from '../../domain/branch.entity';

export interface CreateBranchInput {
  name: string;
  address: string;
  isActive?: boolean;
}

export interface UpdateBranchInput {
  name?: string;
  address?: string;
  isActive?: boolean;
}

/** Puerto de salida: sucursales en el servidor (la implementación va en `infrastructure`). */
export interface BranchesRepository {
  list(): Promise<Branch[]>;
  create(input: CreateBranchInput): Promise<Branch>;
  update(id: string, input: UpdateBranchInput): Promise<Branch>;
}
