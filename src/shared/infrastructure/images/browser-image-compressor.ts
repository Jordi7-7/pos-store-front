import { JPEG_QUALITY, keepCompressed } from '../../domain/rules/image-compression';

/**
 * Vuelve a guardar un JPEG con el navegador, con las mismas medidas y calidad alta. Los PNG y WebP se suben tal cual (se
 * perdería la transparencia o no se ganaría nada). Si algo falla, se sube el original.
 */
export class BrowserImageCompressor {
  async compress(file: File): Promise<File> {
    if (file.type !== 'image/jpeg') return file;
    try {
      // `from-image` respeta la rotación que anota la cámara
      const image = await createImageBitmap(file, { imageOrientation: 'from-image' });
      try {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (!context) return file;
        context.drawImage(image, 0, 0);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
        return blob && keepCompressed(file.size, blob.size) ? new File([blob], file.name, { type: 'image/jpeg' }) : file;
      } finally {
        image.close();
      }
    } catch (error) {
      console.warn('No se pudo comprimir la foto; se sube el original', error);
      return file;
    }
  }
}
