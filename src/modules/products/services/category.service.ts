import { apiClient } from '@/lib/apiClient';

export interface Category {
  id: string;
  name: string;
}

export const categoryService = {
  getCategories: async (): Promise<Category[]> => {
    return apiClient.get<Category[]>('/products/categories');
  },

  createCategory: async (name: string): Promise<Category> => {
    return apiClient.post<Category>('/products/categories', { name });
  }
};
