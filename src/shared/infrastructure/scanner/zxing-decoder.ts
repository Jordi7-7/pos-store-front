import { BarcodeFormat, BinaryBitmap, DecodeHintType, HybridBinarizer, MultiFormatReader, NotFoundException, RGBLuminanceSource } from '@zxing/library';

const reader = new MultiFormatReader();
reader.setHints(
  new Map<DecodeHintType, unknown>([
    [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128, BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_39]],
    [DecodeHintType.TRY_HARDER, true],
  ]),
);

/** Un fotograma en gris (un byte por punto, 0 = negro). Los píxeles RGBA de un canvas se convierten con `rgbaToLuminance`. */
export function rgbaToLuminance(rgba: ArrayLike<number>, width: number, height: number): Uint8ClampedArray {
  const luminance = new Uint8ClampedArray(width * height);
  for (let i = 0; i < luminance.length; i++) {
    luminance[i] = ((rgba[i * 4] ?? 0) * 299 + (rgba[i * 4 + 1] ?? 0) * 587 + (rgba[i * 4 + 2] ?? 0) * 114) / 1000;
  }
  return luminance;
}

/** Lee el código de barras de un fotograma en gris, o `null` si no hay ninguno legible. */
export function decodeLuminance(luminance: Uint8ClampedArray, width: number, height: number): string | null {
  try {
    return reader.decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(luminance, width, height)))).getText();
  } catch (error) {
    if (error instanceof NotFoundException) return null;
    return null; // un fotograma borroso o a medias no es un fallo: se prueba con el siguiente
  }
}
