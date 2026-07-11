import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

const API_URL = 'http://localhost:3000'; // Default port for NestJS dev server

export const apiClient = {
  request: async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    // Obtiene de forma directa las variables de sesión del store de Zustand (fuera del ciclo React)
    const { accessToken, tenantId } = useAuthStore.getState();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    if (tenantId) {
      headers['x-tenant-id'] = tenantId;
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    return response.json();
  },

  get: <T>(path: string, options?: RequestInit) => 
    apiClient.request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body: any, options?: RequestInit) => 
    apiClient.request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
};
export default apiClient;
