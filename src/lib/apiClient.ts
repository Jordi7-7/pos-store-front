import { HttpClient, type HttpClientHooks } from '@/shared/infrastructure/http/http-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Cliente HTTP de la aplicación. No importa el store ni `sonner`: la sesión se inyecta con
 * `configureApiClient` desde la raíz de composición (`src/app/configure-api-client.ts`).
 */
export const httpClient = new HttpClient({
  baseUrl: API_URL,
  // En estas rutas un 401 es una respuesta normal (credenciales, token vencido…), no una sesión caída.
  refreshExemptPaths: ['/auth/login', '/auth/pin-login', '/auth/logout', '/auth/refresh', '/tenants/public'],
});

export const configureApiClient = (hooks: HttpClientHooks): void => httpClient.configure(hooks);

/** Fachada con la forma histórica (`apiClient.get/post/...`) para no tocar los servicios existentes. */
export const apiClient = {
  request: <T>(path: string, options?: RequestInit) => httpClient.request<T>(path, options),
  get: <T>(path: string, options?: RequestInit) => httpClient.get<T>(path, options),
  post: <T>(path: string, body?: unknown, options?: RequestInit) => httpClient.post<T>(path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestInit) => httpClient.put<T>(path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestInit) => httpClient.patch<T>(path, body, options),
  delete: <T>(path: string, options?: RequestInit) => httpClient.delete<T>(path, options),
};
export default apiClient;
