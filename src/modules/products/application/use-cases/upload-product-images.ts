import type { ImageAssignment, ImageTarget } from '../../domain/entities/image-files.entity';
import { assignmentFor } from '../../domain/rules/bulk-images';
import type { ImageCompressor } from '../ports/image-compressor';
import type { ProductsRepository } from '../ports/products.repository';

/** Fotos que se suben a la vez. */
const PARALLEL_UPLOADS = 3;

export interface PendingImage {
  key: string;
  file: File;
  target: ImageTarget;
  /** Ya está en la galería (de un intento anterior): solo falta asignarla. */
  imageId?: string;
}

export type ImageProgress = { state: 'uploading' } | { state: 'uploaded'; imageId: string } | { state: 'failed'; error: unknown } | { state: 'assigned' };

export interface UploadProductImagesOptions {
  onProgress: (key: string, progress: ImageProgress) => void;
  /** Para no empezar más subidas; las que ya empezaron terminan y se asignan. */
  signal?: AbortSignal;
}

/** Sube a la galería y registra una foto. */
export interface ImageUploader {
  execute(input: { file: File; description?: string }): Promise<{ id: string }>;
}

/**
 * Sube las fotos (comprimidas, varias a la vez) y después asigna en un solo paso las que subieron. Un fallo en una no
 * detiene las demás. Si lo que falla es la asignación, las fotos conservan su `imageId` para reintentar sin volver a subirlas.
 */
export class UploadProductImages {
  constructor(
    private readonly compressor: ImageCompressor,
    private readonly uploader: ImageUploader,
    private readonly products: Pick<ProductsRepository, 'assignImages'>,
  ) {}

  async execute(images: readonly PendingImage[], { onProgress, signal }: UploadProductImagesOptions): Promise<{ assigned: number; failed: number }> {
    const ready: Array<{ key: string; assignment: ImageAssignment }> = [];
    let failed = 0;
    const queue = [...images];

    const worker = async () => {
      for (let image = queue.shift(); image && !signal?.aborted; image = queue.shift()) {
        try {
          let { imageId } = image;
          if (!imageId) {
            onProgress(image.key, { state: 'uploading' });
            imageId = (await this.uploader.execute({ file: await this.compressor.compress(image.file), description: image.file.name })).id;
          }
          onProgress(image.key, { state: 'uploaded', imageId });
          ready.push({ key: image.key, assignment: assignmentFor(imageId, image.target) });
        } catch (error) {
          failed += 1;
          onProgress(image.key, { state: 'failed', error });
        }
      }
    };
    await Promise.all(Array.from({ length: PARALLEL_UPLOADS }, worker));

    if (ready.length === 0) return { assigned: 0, failed };
    try {
      await this.products.assignImages(ready.map((item) => item.assignment));
    } catch (error) {
      for (const { key } of ready) onProgress(key, { state: 'failed', error });
      return { assigned: 0, failed: failed + ready.length };
    }
    for (const { key } of ready) onProgress(key, { state: 'assigned' });
    return { assigned: ready.length, failed };
  }
}
