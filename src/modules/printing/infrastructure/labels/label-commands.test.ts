import { describe, expect, it } from 'vitest';
import type { MonoBitmap } from '../../domain/rules/label-bitmap';
import { tsplCalibrate, tsplImageJob, zplCalibrate, zplImageJob } from './label-commands';

const decode = (bytes: Uint8Array): string => new TextDecoder('latin1').decode(bytes);
const roll = { widthMm: 50, heightMm: 25, gapMm: 2 };
const bitmap: MonoBitmap = { widthBytes: 2, height: 2, bytes: Uint8Array.from([0xff, 0x00, 0x0f, 0xf0]) };

describe('comandos de la impresora', () => {
  it('TSPL: tamaño y separación del rollo, la imagen con BITMAP y las copias', () => {
    const text = decode(tsplImageJob(bitmap, roll, 3));
    expect(text.startsWith('SIZE 50 mm,25 mm\r\nGAP 2 mm,0 mm\r\n')).toBe(true);
    expect(text).toContain('BITMAP 0,0,2,2,0,');
    expect(text.endsWith('\r\nPRINT 1,3\r\n')).toBe(true);
  });

  it('TSPL: los bits van invertidos (en TSPL 1 es punto sin imprimir) y sin tocar el resto', () => {
    const job = tsplImageJob(bitmap, roll, 1);
    const start = decode(job).indexOf('BITMAP 0,0,2,2,0,') + 'BITMAP 0,0,2,2,0,'.length;
    expect([...job.slice(start, start + 4)]).toEqual([0x00, 0xff, 0xf0, 0x0f]);
    expect(job.length).toBe(start + 4 + '\r\nPRINT 1,1\r\n'.length);
  });

  it('TSPL: una cantidad de 0 o fraccionaria imprime al menos una etiqueta entera', () => {
    expect(decode(tsplImageJob(bitmap, roll, 0))).toContain('PRINT 1,1');
    expect(decode(tsplImageJob(bitmap, roll, 2.9))).toContain('PRINT 1,2');
  });

  it('ZPL: la imagen va en hexadecimal con 1 = negro, y las copias con ^PQ', () => {
    const text = decode(zplImageJob(bitmap, 16, 2, 5));
    expect(text).toContain('^PW16');
    expect(text).toContain('^LL2');
    expect(text).toContain('^GFA,4,4,2,FF000FF0^FS');
    expect(text).toContain('^PQ5');
  });

  it('calibrar el rollo', () => {
    expect(decode(tsplCalibrate(roll))).toBe('SIZE 50 mm,25 mm\r\nGAPDETECT\r\nAUTODETECT\r\n');
    expect(decode(zplCalibrate())).toBe('~JC\r\n');
  });
});
