import type { UserEntity } from '../../domain/entities/user.entity';

export interface CreateUserInput {
  name: string;
  username: string;
  email?: string;
  password: string;
  roleId: string;
  customPermissions?: string[];
  pin?: string;
  branchIds?: string[];
}

export interface UpdateUserInput {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  roleId?: string;
  customPermissions?: string[];
  pin?: string;
  isActive?: boolean;
  branchIds?: string[];
}

/** Puerto de salida: personal de la tienda en el servidor. */
export interface UsersRepository {
  list(): Promise<UserEntity[]>;
  create(input: CreateUserInput): Promise<UserEntity>;
  update(id: string, input: UpdateUserInput): Promise<UserEntity>;
  /** Genera un PIN nuevo para el usuario; el PIN solo se conoce en este momento. */
  generatePin(userId: string): Promise<{ pin: string; userId: string }>;
}
