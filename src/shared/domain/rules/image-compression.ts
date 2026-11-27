/** Calidad al volver a guardar un JPEG: la diferencia no se aprecia a la vista. */
export const JPEG_QUALITY = 0.9;
/** Si comprimir no ahorra al menos esto, se usa el original: no vale la pena tocarlo. */
const MIN_SAVING = 0.1;

export const keepCompressed = (originalBytes: number, compressedBytes: number): boolean => compressedBytes > 0 && compressedBytes <= originalBytes * (1 - MIN_SAVING);
