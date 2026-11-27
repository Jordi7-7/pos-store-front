import { describe, expect, it } from 'vitest';
import type { ProductEntity } from '../entities/product.entity';
import { ProductType } from '../enums';
import { assignmentFor, MAX_BULK_IMAGE_BYTES, screenImageFiles, targetLabel, targetsOfProducts } from './bulk-images';

const file = (name: string, type = 'image/jpeg', size = 1000) => ({ name, type, size });
const MB = 1024 * 1024;

describe('qué fotos entran en una tanda', () => {
  it('admite JPG, PNG y WebP de hasta 7 MB', () => {
    const files = [file('a.jpg', 'image/jpeg', 7 * MB), file('b.png', 'image/png'), file('c.webp', 'image/webp')];
    expect(screenImageFiles(files)).toEqual({ accepted: files, rejected: [] });
  });

  it('rechaza HEIC aunque el navegador no diga su tipo, otros formatos y las de más de 7 MB', () => {
    const { accepted, rejected } = screenImageFiles([file('IMG_1.HEIC', ''), file('x.jpg', 'image/heic'), file('v.mp4', 'video/mp4'), file('g.jpg', 'image/jpeg', MAX_BULK_IMAGE_BYTES + 1)]);
    expect(accepted).toEqual([]);
    expect(rejected.map((item) => item.reason)).toEqual([expect.stringContaining('HEIC'), expect.stringContaining('HEIC'), expect.stringContaining('JPG'), expect.stringContaining('7 MB')]);
  });

  it('no pasa de 200 contando las que ya estaban', () => {
    const already = Array.from({ length: 198 }, (_, index) => file(`a${index}.jpg`));
    const { accepted, rejected } = screenImageFiles([file('n1.jpg'), file('n2.jpg'), file('n3.jpg')], already);
    expect(accepted.map((item) => item.name)).toEqual(['n1.jpg', 'n2.jpg']);
    expect(rejected).toEqual([{ name: 'n3.jpg', reason: expect.stringContaining('200') }]);
  });

  it('no repite un archivo que ya está en la lista', () => {
    expect(screenImageFiles([file('a.jpg'), file('a.jpg'), file('b.jpg')], [file('b.jpg')]).accepted).toHaveLength(1);
  });
});

describe('destinos', () => {
  const product = (type: ProductType) =>
    ({ id: 'p', name: 'Mochila KTM', type, baseSku: 'KTM', variants: [{ id: 'v1', sku: 'KTM-01', attributes: [{ name: 'Diseño', value: '01' }] }] }) as unknown as ProductEntity;

  it('un producto con variantes ofrece el producto y cada variante; uno simple solo el producto', () => {
    expect(targetsOfProducts([product(ProductType.VARIABLE)]).map(targetLabel)).toEqual(['Mochila KTM · KTM', 'Mochila KTM · 01 · KTM-01']);
    expect(targetsOfProducts([product(ProductType.SIMPLE)])).toHaveLength(1);
  });

  it('cada foto va a la variante o al producto, nunca a los dos', () => {
    const [parent, variant] = targetsOfProducts([product(ProductType.VARIABLE)]);
    if (!parent || !variant) throw new Error('faltan destinos');
    expect(assignmentFor('i', parent)).toEqual({ imageId: 'i', productId: 'p' });
    expect(assignmentFor('i', variant)).toEqual({ imageId: 'i', variantId: 'v1' });
  });
});
