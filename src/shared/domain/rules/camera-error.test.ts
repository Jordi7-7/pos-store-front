import { describe, expect, it } from 'vitest';
import { classifyCameraFailure } from './camera-error';

describe('fallos de la cámara', () => {
  it('sin permiso', () => {
    expect(classifyCameraFailure('NotAllowedError', false)).toBe('denied');
    expect(classifyCameraFailure('SecurityError', true)).toBe('denied');
  });

  it('sin cámara', () => {
    expect(classifyCameraFailure('NotFoundError', false)).toBe('no-camera');
    expect(classifyCameraFailure('OverconstrainedError', false)).toBe('no-camera');
  });

  it('si la cámara recordada ya no existe no es un fallo: se pide la de siempre', () => {
    expect(classifyCameraFailure('OverconstrainedError', true)).toBe('remembered-camera-missing');
  });

  it('cualquier otro error (cámara ocupada, etc.) es un fallo genérico', () => {
    expect(classifyCameraFailure('NotReadableError', false)).toBe('error');
    expect(classifyCameraFailure('', false)).toBe('error');
  });
});
