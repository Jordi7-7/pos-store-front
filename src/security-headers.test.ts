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

describe('Permissions-Policy de producción', () => {
  const policy = /add_header Permissions-Policy "([^"]+)"/.exec(config)?.[1]?.split(/,\s*/) ?? [];

  it('deja a esta página usar la cámara (escáner) y los puertos de las impresoras', () => {
    expect(policy).toEqual(expect.arrayContaining(['camera=(self)', 'usb=(self)', 'serial=(self)']));
  });

  it('sigue sin micrófono ni ubicación', () => {
    expect(policy).toEqual(expect.arrayContaining(['microphone=()', 'geolocation=()']));
  });
});
