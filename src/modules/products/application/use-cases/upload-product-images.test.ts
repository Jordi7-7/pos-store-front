import { describe, expect, it, vi } from 'vitest';
import type { ImageTarget } from '../../domain/entities/image-files.entity';
import { UploadProductImages, type ImageProgress, type PendingImage } from './upload-product-images';

const target: ImageTarget = { kind: 'VARIANT', productId: 'p', variantId: 'v', productName: 'X', sku: 'X-1', attributes: [] };
const pending = (key: string, imageId?: string): PendingImage => ({ key, file: new File(['x'], `${key}.jpg`, { type: 'image/jpeg' }), target, imageId });

function setup(options: { failUpload?: string; failAssign?: boolean } = {}) {
  let running = 0;
  let peak = 0;
  const compressor = { compress: vi.fn(async (file: File) => file) };
  const uploader = {
    execute: vi.fn(async ({ file }: { file: File }) => {
      peak = Math.max(peak, ++running);
      await Promise.resolve();
      running -= 1;
      if (file.name === `${options.failUpload}.jpg`) throw new Error('sin red');
      return { id: `id-${file.name}` };
    }),
  };
  const products = { assignImages: vi.fn(async (_items: unknown[]) => (options.failAssign ? Promise.reject(new Error('caído')) : undefined)) };
  const last = new Map<string, ImageProgress>();
  const run = (images: PendingImage[], signal?: AbortSignal) => new UploadProductImages(compressor, uploader, products).execute(images, { signal, onProgress: (key, progress) => last.set(key, progress) });
  return { run, compressor, uploader, products, last, peak: () => peak };
}

describe('subida masiva de fotos', () => {
  it('comprime, sube como mucho 3 a la vez y asigna todo en un solo paso', async () => {
    const { run, compressor, products, last, peak } = setup();
    await expect(run(['a', 'b', 'c', 'd', 'e'].map((key) => pending(key)))).resolves.toEqual({ assigned: 5, failed: 0 });
    expect(compressor.compress).toHaveBeenCalledTimes(5);
    expect(peak()).toBe(3);
    expect(products.assignImages).toHaveBeenCalledTimes(1);
    expect(products.assignImages.mock.calls[0]?.[0]).toContainEqual({ imageId: 'id-a.jpg', variantId: 'v' });
    expect([...last.values()].every((progress) => progress.state === 'assigned')).toBe(true);
  });

  it('una foto que falla no detiene las demás', async () => {
    const { run, last } = setup({ failUpload: 'b' });
    await expect(run([pending('a'), pending('b'), pending('c')])).resolves.toEqual({ assigned: 2, failed: 1 });
    expect(last.get('b')?.state).toBe('failed');
    expect(last.get('c')?.state).toBe('assigned');
  });

  it('al reintentar, lo que ya está en la galería no se vuelve a subir', async () => {
    const { run, uploader, products } = setup();
    await run([pending('a', 'ya-subida')]);
    expect(uploader.execute).not.toHaveBeenCalled();
    expect(products.assignImages).toHaveBeenCalledWith([{ imageId: 'ya-subida', variantId: 'v' }]);
  });

  it('si falla la asignación, avisa de todas y no cuenta ninguna', async () => {
    const { run, last } = setup({ failAssign: true });
    await expect(run([pending('a'), pending('b')])).resolves.toEqual({ assigned: 0, failed: 2 });
    expect(last.get('a')?.state).toBe('failed');
  });

  it('al detener no empieza más subidas', async () => {
    const { run, uploader, products } = setup();
    const abort = new AbortController();
    abort.abort();
    await expect(run([pending('a'), pending('b')], abort.signal)).resolves.toEqual({ assigned: 0, failed: 0 });
    expect(uploader.execute).not.toHaveBeenCalled();
    expect(products.assignImages).not.toHaveBeenCalled();
  });
});
