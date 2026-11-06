import { apiClient } from '@/lib/apiClient';
import type { CreateUserInput, UpdateUserInput, UsersRepository } from '../../application/ports/users.repository';
import type { UserEntity } from '../../domain/entities/user.entity';

/** Personal por HTTP. La API ya responde con la forma de la entidad, sin importes ni textos que formatear. */
export class UsersHttpRepository implements UsersRepository {
  list(): Promise<UserEntity[]> {
    return apiClient.get<UserEntity[]>('/users');
  }

  create(input: CreateUserInput): Promise<UserEntity> {
    return apiClient.post<UserEntity>('/users', input);
  }

  update(id: string, input: UpdateUserInput): Promise<UserEntity> {
    return apiClient.put<UserEntity>(`/users/${id}`, input);
  }

  generatePin(userId: string): Promise<{ pin: string; userId: string }> {
    return apiClient.post<{ pin: string; userId: string }>(`/users/${userId}/generate-pin`, {});
  }
}
