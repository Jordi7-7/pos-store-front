import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/** Cabeceras que nginx pone en producción (en desarrollo no existen, así que un bloqueo solo se vería desplegado). */
const config = readFileSync(resolve(process.cwd(), 'security-headers.conf'), 'utf8');
const directive = (name: string): string[] => new RegExp(`add_header Content-Security-Policy "[^"]*?\\b${name} ([^;"]+)`).exec(config)?.[1]?.trim().split(/\s+/) ?? [];

describe('Content-Security-Policy de producción', () => {
  it('deja subir imágenes directo al almacenamiento además de hablar con la API', () => {
    expect(directive('connect-src')).toEqual(["'self'", 'https://*.r2.cloudflarestorage.com']);
  });

  it('sigue ejecutando solo código propio', () => {
    expect(directive('script-src')).toEqual(["'self'"]);
  });
});
