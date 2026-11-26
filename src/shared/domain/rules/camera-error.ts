/** Qué le pasó a la cámara, en lo que importa para avisar a la persona. */
export type CameraFailure = 'denied' | 'remembered-camera-missing' | 'no-camera' | 'error';

/**
 * Traduce el nombre del error de `getUserMedia`. `OverconstrainedError` con una cámara pedida a propósito significa que la
 * recordada ya no está (otro teléfono, otro permiso): no es un fallo, se vuelve a la trasera por defecto.
 */
export function classifyCameraFailure(errorName: string, askedForSpecificCamera: boolean): CameraFailure {
  if (errorName === 'NotAllowedError' || errorName === 'SecurityError') return 'denied';
  if (errorName === 'OverconstrainedError') return askedForSpecificCamera ? 'remembered-camera-missing' : 'no-camera';
  if (errorName === 'NotFoundError') return 'no-camera';
  return 'error';
}
