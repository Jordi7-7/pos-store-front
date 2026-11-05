import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/infrastructure/http/api-error';
import { getErrorMessage } from './error-messages';

const apiError = (code: string, message = 'mensaje del backend', status = 400) =>
  new ApiError({ status, code, message });

describe('getErrorMessage', () => {
  it('usa el catálogo cuando el código está en él, ignorando el message', () => {
    expect(getErrorMessage(apiError('TOO_MANY_ATTEMPTS', 'cualquier texto', 429), 'x')).toMatch(/Demasiados intentos/);
  });

  it('usa el message del backend cuando el código no está en el catálogo', () => {
    expect(getErrorMessage(apiError('CASH_REGISTER_BUSY', 'La Caja 2 ya tiene un turno abierto'), 'x')).toBe(
      'La Caja 2 ya tiene un turno abierto',
    );
  });

  it('un fallo de red tiene su propio texto', () => {
    expect(getErrorMessage(ApiError.network(new TypeError('Failed to fetch')), 'x')).toMatch(/conexión/);
  });

  it('un error sin contrato (UNKNOWN_ERROR) o ajeno al cliente HTTP usa el texto de respaldo', () => {
    expect(getErrorMessage(apiError('UNKNOWN_ERROR', 'La solicitud falló con estado 502.', 502), 'Error al guardar')).toBe(
      'Error al guardar',
    );
    expect(getErrorMessage(new Error('Cannot read properties of undefined'), 'Error al guardar')).toBe('Error al guardar');
    expect(getErrorMessage('texto', 'Error al guardar')).toBe('Error al guardar');
  });
});
