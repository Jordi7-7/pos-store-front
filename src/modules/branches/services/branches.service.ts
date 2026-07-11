import { apiClient } from '@/lib/apiClient';

export interface Branch {
  id: string;
  name: string;
  address: string;
}

export const branchesService = {
  getBranches: async (): Promise<Branch[]> => {
    return apiClient.get<Branch[]>('/branches');
  }
};
