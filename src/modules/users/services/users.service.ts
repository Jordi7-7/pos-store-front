import { apiClient } from '@/lib/apiClient';

export interface UserRoleInfo {
  id: string;
  name: string;
}

export interface UserBranchInfo {
  id: string;
  name: string;
  address?: string | null;
}

export interface UserItem {
  id: string;
  name: string;
  username: string;
  email?: string | null;
  isOwner: boolean;
  role: UserRoleInfo | null;
  customPermissions?: string[] | null;
  hasPin: boolean;
  isActive: boolean;
  branches: UserBranchInfo[];
  createdAt: string;
  updatedAt: string;
}

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
