import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiClient = {
  request: async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    // Obtiene de forma directa las variables de sesión del store de Zustand (fuera del ciclo React)
    const { accessToken } = useAuthStore.getState();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (
        response.status === 401 &&
        !path.includes('/auth/login') &&
        !path.includes('/auth/pin-login') &&
        !path.includes('/auth/logout') &&
        !path.includes('/tenants/public')
      ) {
        // Token expirado o inválido: Cerrar sesión y redirigir
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  },

  get: <T>(path: string, options?: RequestInit) => 
    apiClient.request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body: any, options?: RequestInit) => 
    apiClient.request<T>(path, { ...options, method: 'POST', body: JSON.stringify(body) }),

  put: <T>(path: string, body: any, options?: RequestInit) => 
    apiClient.request<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(path: string, body: any, options?: RequestInit) => 
    apiClient.request<T>(path, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(path: string, options?: RequestInit) => 
    apiClient.request<T>(path, { ...options, method: 'DELETE' }),
};
export default apiClient;
