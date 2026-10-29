import { toast } from 'sonner';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let activeRefreshPromise: Promise<boolean> | null = null;

async function executeRefresh(): Promise<boolean> {
  if (!activeRefreshPromise) {
    activeRefreshPromise = useAuthStore.getState().refreshSession().finally(() => {
      activeRefreshPromise = null;
    });
  }
  return activeRefreshPromise;
}

export const apiClient = {
  request: async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    // Obtiene de forma directa las variables de sesión del store de Zustand (fuera del ciclo React)
    const { accessToken } = useAuthStore.getState();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (accessToken && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const isAuthEndpoint =
        path.includes('/auth/login') ||
        path.includes('/auth/pin-login') ||
        path.includes('/auth/logout') ||
        path.includes('/tenants/public') ||
        path.includes('/auth/refresh');

      // Si responde 401 y no es un endpoint de login/logout/refresh, intentar auto-renovación y reintento
      if (response.status === 401 && !isAuthEndpoint) {
        const refreshed = await executeRefresh();
        if (refreshed) {
          const latestToken = useAuthStore.getState().accessToken;
          const retryHeaders: Record<string, string> = {
            ...headers,
            ...(latestToken ? { Authorization: `Bearer ${latestToken}` } : {}),
          };

          const retryResponse = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: retryHeaders,
          });

          if (retryResponse.ok) {
            if (retryResponse.status === 204) {
              return {} as T;
            }
            const retryText = await retryResponse.text();
            return retryText ? JSON.parse(retryText) : ({} as T);
          }
        } else {
          // Si el refresh token también venció o fue revocado en backend/Redis, cerrar sesión y avisar
          const state = useAuthStore.getState();
          state.logout();
          toast.error('Tu sesión ha expirado por completo. Por favor inicia sesión nuevamente.');
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
