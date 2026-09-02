import { apiClient } from '@/lib/apiClient';

export interface UserItem {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'CASHIER' | 'MANAGER';
  hasPin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  name: string;
  username?: string;
  email: string;
  password: string;
  role: 'OWNER' | 'ADMIN' | 'CASHIER' | 'MANAGER';
  pin?: string;
}

export interface UpdateUserInput {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  role?: 'OWNER' | 'ADMIN' | 'CASHIER' | 'MANAGER';
  pin?: string;
  isActive?: boolean;
}

export const usersService = {
  getUsers: async (): Promise<UserItem[]> => {
    return apiClient.get<UserItem[]>('/users');
  },

  createUser: async (input: CreateUserInput): Promise<UserItem> => {
    return apiClient.post<UserItem>('/users', input);
  },

  updateUser: async (id: string, input: UpdateUserInput): Promise<UserItem> => {
    return apiClient.put<UserItem>(`/users/${id}`, input);
  },

  generatePin: async (userId: string): Promise<{ pin: string; userId: string }> => {
    return apiClient.post<{ pin: string; userId: string }>(`/users/${userId}/generate-pin`, {});
  },
};
