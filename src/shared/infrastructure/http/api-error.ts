/**
 * Contrato de errores del backend (`pos-store/docs/error-codes.md`):
 * { statusCode, code, message, details?, path, timestamp, requestId }.
 * La interfaz decide qué mostrar por `code`, nunca parseando `message`.
 */

/** Códigos que genera el cliente (no vienen del backend). */
export const CLIENT_ERROR_CODES = {
  /** No hubo respuesta: sin red, CORS, servidor caído. */
  NETWORK_ERROR: 'NETWORK_ERROR',
  /** El servidor respondió con algo que no cumple el contrato. */
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  /** Respuesta 2xx con un cuerpo que no es JSON válido. */
  INVALID_RESPONSE: 'INVALID_RESPONSE',
} as const;

export interface ApiErrorInit {
  status: number;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
  path?: string;
  timestamp?: string;
  cause?: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  readonly requestId: string | undefined;
  readonly path: string | undefined;
  readonly timestamp: string | undefined;

  constructor(init: ApiErrorInit) {
    super(init.message, init.cause === undefined ? undefined : { cause: init.cause });
    this.name = 'ApiError';
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
    this.requestId = init.requestId;
    this.path = init.path;
    this.timestamp = init.timestamp;
  }

  get isNetworkError(): boolean {
    return this.code === CLIENT_ERROR_CODES.NETWORK_ERROR;
  }

  static network(cause: unknown): ApiError {
    return new ApiError({
      status: 0,
      code: CLIENT_ERROR_CODES.NETWORK_ERROR,
      message: 'No se pudo conectar con el servidor.',
      cause,
    });
  }

  /** Construye el error desde una respuesta no exitosa, tolerando cuerpos que no cumplen el contrato. */
  static async fromResponse(response: Response): Promise<ApiError> {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = undefined;
    }
    const record = isRecord(body) ? body : {};
    const code = typeof record.code === 'string' ? record.code : CLIENT_ERROR_CODES.UNKNOWN_ERROR;
    const message =
      typeof record.message === 'string' && record.message
        ? record.message
        : `La solicitud falló con estado ${response.status}.`;
    return new ApiError({
      status: response.status,
      code,
      message,
      details: record.details,
      requestId: typeof record.requestId === 'string' ? record.requestId : undefined,
      path: typeof record.path === 'string' ? record.path : undefined,
      timestamp: typeof record.timestamp === 'string' ? record.timestamp : undefined,
    });
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
