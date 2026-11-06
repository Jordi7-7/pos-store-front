/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/shared/infrastructure/http/api-error';
import { ERROR_MESSAGES, getErrorMessage } from './error-messages';

const apiError = (code: string, message = 'mensaje del backend', status = 400, details?: unknown) => new ApiError({ status, code, message, details });

describe('getErrorMessage', () => {
  it('usa el catálogo cuando el código está en él, ignorando el message', () => {
    expect(getErrorMessage(apiError('TOO_MANY_ATTEMPTS', 'cualquier texto', 429), 'x')).toMatch(/Demasiados intentos/);
    expect(getErrorMessage(apiError('PRODUCT_HAS_STOCK', 'texto que puede cambiar', 409), 'x')).toMatch(/existencias/);
  });

  it('arma el mensaje con los details cuando el texto los usa', () => {
    expect(getErrorMessage(apiError('CASH_REGISTER_BUSY', 'x', 409, { cashRegisterName: 'Caja 2', openedBy: 'Ana' }), 'f')).toBe(
      'La Caja 2 ya tiene un turno abierto (por Ana). Cierra ese turno o elige otra caja.',
    );
    expect(getErrorMessage(apiError('SKU_TAKEN', 'x', 409, { sku: 'AB-1' }), 'f')).toBe('El SKU AB-1 ya está registrado en otra variante.');
    expect(getErrorMessage(apiError('SKU_TAKEN', 'x', 409, { skus: ['A', 'B'] }), 'f')).toBe('El SKU A, B ya está registrado en otra variante.');
    expect(getErrorMessage(apiError('INSUFFICIENT_STOCK', 'x', 409, { available: 2, requested: 5 }), 'f')).toBe('No hay stock suficiente: hay 2 y se piden 5.');
    expect(getErrorMessage(apiError('PURCHASE_BATCH_ALREADY_SOLD', 'x', 409, { consumed: 3 }), 'f')).toMatch(/3 unidad/);
    expect(getErrorMessage(apiError('VALIDATION_FAILED', 'x', 400, ['name must not be empty', 'price must be positive']), 'f')).toBe(
      'Revisa los datos ingresados: name must not be empty, price must be positive',
    );
  });

  it('si faltan los details el texto sigue siendo correcto', () => {
    for (const code of ['CASH_REGISTER_BUSY', 'SKU_TAKEN', 'INSUFFICIENT_STOCK', 'ROLE_IN_USE', 'IMPORT_LIMIT_EXCEEDED', 'VALIDATION_FAILED', 'CATEGORY_NAME_TAKEN']) {
      const message = getErrorMessage(apiError(code, 'x'), 'f');
      expect(message, code).not.toMatch(/undefined|null|\[object/);
      expect(message.length, code).toBeGreaterThan(10);
    }
    // details con una forma inesperada tampoco rompen nada
    expect(getErrorMessage(apiError('SKU_TAKEN', 'x', 409, 'texto suelto'), 'f')).toMatch(/SKU/);
    expect(getErrorMessage(apiError('SKU_TAKEN', 'x', 409, null), 'f')).toMatch(/SKU/);
  });

  it('un código sin entrada en el catálogo usa el message del backend', () => {
    expect(getErrorMessage(apiError('INVALID_REFUND', 'La cantidad a devolver excede lo vendido'), 'x')).toBe('La cantidad a devolver excede lo vendido');
  });

  it('un fallo de red tiene su propio texto', () => {
    expect(getErrorMessage(ApiError.network(new TypeError('Failed to fetch')), 'x')).toMatch(/conexión/);
  });

  it('un error sin contrato (UNKNOWN_ERROR) o ajeno al cliente HTTP usa el texto de respaldo', () => {
    expect(getErrorMessage(apiError('UNKNOWN_ERROR', 'La solicitud falló con estado 502.', 502), 'Error al guardar')).toBe('Error al guardar');
    expect(getErrorMessage(new Error('Cannot read properties of undefined'), 'Error al guardar')).toBe('Error al guardar');
    expect(getErrorMessage('texto', 'Error al guardar')).toBe('Error al guardar');
  });
});

/** Códigos que el catálogo deja a propósito con el `message` del backend (explican un caso concreto). */
const PASSTHROUGH = new Set(['INVALID_REFUND', 'INVALID_SALE_AMOUNTS', 'INVALID_REFERENCE', 'INVALID_MEDIA_URL']);

describe('catálogo frente a pos-store/docs/error-codes.md', () => {
  // El backend vive en otro repositorio: esta comprobación solo corre cuando está al lado (el monorepo local).
  const doc = '../pos-store/docs/error-codes.md';
  it.skipIf(!existsSync(doc))('cubre todos los códigos del backend, salvo los que dejan pasar su message', () => {
    const codes = new Set([...readFileSync(doc, 'utf8').matchAll(/^\| `([A-Z_]+)` \|/gm)].map((match) => match[1] as string));
    expect(codes.size).toBeGreaterThan(80);
    const missing = [...codes].filter((code) => !(code in ERROR_MESSAGES) && !PASSTHROUGH.has(code));
    expect(missing).toEqual([]);
  });

  it('todo mensaje del catálogo tiene texto', () => {
    for (const [code, entry] of Object.entries(ERROR_MESSAGES)) {
      const message = typeof entry === 'function' ? entry({}, undefined) : entry;
      expect(message.trim().length, code).toBeGreaterThan(5);
    }
  });
});
