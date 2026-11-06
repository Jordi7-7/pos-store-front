import type { CashRegisterEntity, MyCashRegisterEntity } from '../../domain/entities/cash-register.entity';

export interface CreateCashRegisterInput {
  branchId: string;
  name: string;
}

export interface UpdateCashRegisterInput {
  name?: string;
  isActive?: boolean;
}

/** Puerto de salida: cajas registradoras en el servidor (la implementación va en `infrastructure`). */
export interface CashRegistersRepository {
  listMine(branchId?: string): Promise<MyCashRegisterEntity[]>;
  list(branchId?: string): Promise<CashRegisterEntity[]>;
  create(input: CreateCashRegisterInput): Promise<CashRegisterEntity>;
  update(id: string, input: UpdateCashRegisterInput): Promise<CashRegisterEntity>;
  assignUsers(id: string, userIds: string[]): Promise<void>;
}
