import { ApiError, CLIENT_ERROR_CODES } from './api-error';

/**
 * Lo que el cliente necesita saber de la sesión, inyectado desde fuera.
 * Así este archivo no importa Zustand ni `sonner` y se rompe el ciclo store ⇄ servicios ⇄ cliente.
 */
export interface HttpClientHooks {
  getAccessToken: () => string | null;
  /** Renueva la sesión; `true` si hay un token nuevo. */
  refreshSession: () => Promise<boolean>;
  /** Se llama cuando la sesión no se pudo renovar (refresh vencido o revocado). */
  onSessionExpired: () => void;
}

export interface HttpClientConfig {
  baseUrl: string;
  /** Rutas (prefijo) donde un 401 NO debe provocar renovación: login, refresh, logout… */
  refreshExemptPaths?: readonly string[];
  /**
   * Rutas (prefijo) de la sesión por cookie: el navegador debe mandar y recibir cookies (`credentials: 'include'`) y la
   * llamada lleva la cabecera propia que el servidor exige contra CSRF. Solo estas rutas: el resto usa `Authorization`.
   */
  credentialedPaths?: readonly string[];
  /** Cabecera que acompaña a las rutas con cookie. */
  credentialedHeaders?: Readonly<Record<string, string>>;
}

const NO_SESSION_HOOKS: HttpClientHooks = {
  getAccessToken: () => null,
  refreshSession: async () => false,
  onSessionExpired: () => {},
};

export class HttpClient {
  private hooks: HttpClientHooks = NO_SESSION_HOOKS;
  private refreshInFlight: Promise<boolean> | null = null;

  constructor(private readonly config: HttpClientConfig) {}

  configure(hooks: HttpClientHooks): void {
    this.hooks = hooks;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    let response = await this.send(path, options);

    if (response.status === 401 && !this.isRefreshExempt(path)) {
      if (await this.refreshOnce()) {
        response = await this.send(path, options);
      } else {
        this.hooks.onSessionExpired();
      }
    }

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }
    return this.parseBody<T>(response);
  }

  get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'POST', body: serialize(body) });
  }

  put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PUT', body: serialize(body) });
  }

  patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'PATCH', body: serialize(body) });
  }

  delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  private async send(path: string, options: RequestInit): Promise<Response> {
    const headers = new Headers(options.headers);
    if (typeof options.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const token = this.hooks.getAccessToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const credentialed = this.isCredentialed(path);
    if (credentialed) {
      for (const [name, value] of Object.entries(this.config.credentialedHeaders ?? {})) headers.set(name, value);
    }
    try {
      return await fetch(`${this.config.baseUrl}${path}`, { ...options, headers, ...(credentialed ? { credentials: 'include' as const } : {}) });
    } catch (cause) {
      throw ApiError.network(cause);
    }
  }

  /** Una sola renovación a la vez: el refresh token rota y un segundo intento lo invalidaría. */
  private refreshOnce(): Promise<boolean> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.hooks
        .refreshSession()
        .catch(() => false)
        .finally(() => {
          this.refreshInFlight = null;
        });
    }
    return this.refreshInFlight;
  }

  private isCredentialed(path: string): boolean {
    return (this.config.credentialedPaths ?? []).some((prefix) => path.startsWith(prefix));
  }

  private isRefreshExempt(path: string): boolean {
    return (this.config.refreshExemptPaths ?? []).some((prefix) => path.startsWith(prefix));
  }

  private async parseBody<T>(response: Response): Promise<T> {
    if (response.status === 204) return {} as T;
    const text = await response.text();
    if (!text) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch (cause) {
      throw new ApiError({
        status: response.status,
        code: CLIENT_ERROR_CODES.INVALID_RESPONSE,
        message: 'El servidor devolvió una respuesta que no se puede leer.',
        cause,
      });
    }
  }
}

function serialize(body: unknown): string | undefined {
  return body === undefined ? undefined : JSON.stringify(body);
}
