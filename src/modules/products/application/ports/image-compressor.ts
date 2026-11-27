/** Puerto de salida: reducir el peso de una foto antes de subirla. */
export interface ImageCompressor {
  /** La foto comprimida, o la misma si no se puede o no merece la pena. */
  compress(file: File): Promise<File>;
}
