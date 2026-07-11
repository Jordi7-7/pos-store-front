import { apiClient } from '@/lib/apiClient';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'OWNER' | 'ADMIN' | 'CASHIER' | 'MANAGER';
}

export const usersService = {
  createUser: async (input: CreateUserInput): Promise<any> => {
    return apiClient.post<any>('/users', input);
  }
};
