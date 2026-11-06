import { describe, expect, it } from 'vitest';
import { createFormatters } from './formatters';

const mx = createFormatters({ currencyCode: 'MXN', locale: 'es-MX', timezone: 'America/Mexico_City' });
const ec = createFormatters({ currencyCode: 'USD', locale: 'es-EC', timezone: 'America/Guayaquil' });

describe('formateadores de la tienda', () => {
  it('importes con la moneda y el idioma de cada tienda', () => {
    expect(mx.money(1234.5)).toBe('$1,234.50');
    expect(ec.money(1234.5)).toMatch(/1\.234,50/);
    expect(mx.money(null)).toBe('$0.00');
  });

  it('la hora se muestra en la zona de la tienda, no en la del navegador', () => {
    const instant = '2026-11-05T18:30:00Z';
    expect(mx.time(instant)).toMatch(/12:30/); // UTC-6
    expect(ec.time(instant)).toMatch(/(13|01):30/); // UTC-5 (es-EC usa reloj de 12 h)
  });

  it('fecha numérica en la zona de la tienda (el día cambia según la zona)', () => {
    expect(mx.shortDate('2026-11-05T03:30:00Z')).toBe('04/11/2026'); // aún es 4 de noviembre en México
    expect(ec.shortDate(null)).toBe('-');
  });

  it('fechas inválidas o ausentes no rompen la pantalla', () => {
    expect(mx.date(null)).toBe('');
    expect(mx.time('no es fecha')).toBe('');
    expect(mx.dateTime(null)).toBe('-');
    expect(mx.dateTime('no es fecha')).toBe('no es fecha');
  });

  it('duración entre apertura y cierre, o hasta ahora si sigue abierto', () => {
    expect(mx.duration('2026-11-05T10:00:00Z', '2026-11-05T12:15:00Z')).toBe('2h 15m');
    expect(mx.duration('2026-11-05T10:00:00Z', '2026-11-05T10:40:00Z')).toBe('40m');
    expect(mx.duration('2026-11-05T10:00:00Z', null, Date.parse('2026-11-05T11:05:00Z'))).toBe('1h 5m');
    expect(mx.duration(undefined)).toBe('0m');
    expect(mx.duration('2026-11-05T12:00:00Z', '2026-11-05T10:00:00Z')).toBe('0m');
  });
});
