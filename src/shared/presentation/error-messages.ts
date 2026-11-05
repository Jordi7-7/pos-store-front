import { ApiError, CLIENT_ERROR_CODES } from '@/shared/infrastructure/http/api-error';

/**
 * Catálogo `code → mensaje en español`. Se decide siempre por `code`, nunca parseando `message`.
 * Los códigos que no están aquí usan el `message` del backend (ya viene en español y con datos
 * concretos, p. ej. el nombre de la caja). Pendiente de completar con `pos-store/docs/error-codes.md`.
 */
export const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  [CLIENT_ERROR_CODES.NETWORK_ERROR]: 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.',
  [CLIENT_ERROR_CODES.INVALID_RESPONSE]: 'El servidor respondió algo inesperado. Inténtalo de nuevo.',
  TOO_MANY_ATTEMPTS: 'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.',
};

/**
 * Mensaje para mostrar al usuario ante un error.
 * - `ApiError` con código en el catálogo → texto del catálogo.
 * - `ApiError` del backend (con `code` propio) → su `message`.
 * - Cualquier otra cosa (incluidos errores sin contrato) → `fallback`.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  const fromCatalog = ERROR_MESSAGES[error.code];
  if (fromCatalog) return fromCatalog;
  if (error.code === CLIENT_ERROR_CODES.UNKNOWN_ERROR) return fallback;
  return error.message || fallback;
}
