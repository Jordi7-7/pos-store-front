import { apiClient } from '@/lib/apiClient';

export interface Branch {
  id: string;
  name: string;
  address: string;
  code?: number;
  isActive?: boolean;
  createdAt?: string;
}

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

export const branchesService = {
  getBranches: async (): Promise<Branch[]> => {
    return apiClient.get<Branch[]>('/branches');
  },
  createBranch: async (data: CreateBranchInput): Promise<Branch> => {
    return apiClient.post<Branch>('/branches', data);
  },
  updateBranch: async (id: string, data: UpdateBranchInput): Promise<Branch> => {
    return apiClient.put<Branch>(`/branches/${id}`, data);
  },
};
