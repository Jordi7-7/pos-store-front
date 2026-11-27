import type { ImageAssignment, ImageTarget } from '../entities/image-files.entity';
import type { ProductEntity } from '../entities/product.entity';
import { ProductType } from '../enums';

/** Fotos por tanda. El servidor tiene el mismo tope. */
export const MAX_BULK_IMAGES = 200;
export const MAX_BULK_IMAGE_MB = 7;
export const MAX_BULK_IMAGE_BYTES = MAX_BULK_IMAGE_MB * 1024 * 1024;
/** Sin HEIC (el de las fotos del iPhone): los navegadores no lo muestran. */
export const BULK_IMAGE_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];

interface Candidate {
  name: string;
  type: string;
  size: number;
}

export interface Screening<T> {
  accepted: T[];
  rejected: Array<{ name: string; reason: string }>;
}

/** Separa las fotos que se pueden subir de las que no, diciendo por qué. `already` son las que ya están en la tanda. */
export function screenImageFiles<T extends Candidate>(files: readonly T[], already: readonly Candidate[] = []): Screening<T> {
  const keyOf = (file: Candidate) => `${file.name}|${file.size}`;
  const seen = new Set(already.map(keyOf));
  const result: Screening<T> = { accepted: [], rejected: [] };
  for (const file of files) {
    const reject = (reason: string) => result.rejected.push({ name: file.name, reason });
    if (/\.(heic|heif)$/i.test(file.name) || /hei[cf]/i.test(file.type)) reject('el formato HEIC no se admite: conviértela a JPG');
    else if (!BULK_IMAGE_TYPES.includes(file.type)) reject('solo se admiten imágenes JPG, PNG o WebP');
    else if (file.size > MAX_BULK_IMAGE_BYTES) reject(`pesa más de ${MAX_BULK_IMAGE_MB} MB`);
    else if (file.name.length > 255) reject('el nombre del archivo es demasiado largo');
    else if (seen.has(keyOf(file))) reject('ya está en la lista');
    else if (already.length + result.accepted.length >= MAX_BULK_IMAGES) reject(`supera las ${MAX_BULK_IMAGES} fotos por tanda: súbela en la siguiente`);
    else {
      seen.add(keyOf(file));
      result.accepted.push(file);
    }
  }
  return result;
}

export const targetKey = (target: ImageTarget): string => target.variantId ?? target.productId;

export const targetLabel = (target: ImageTarget): string =>
  [target.productName, target.attributes.join(' / '), target.sku ?? ''].filter(Boolean).join(' · ');

export const assignmentFor = (imageId: string, target: ImageTarget): ImageAssignment =>
  target.variantId ? { imageId, variantId: target.variantId } : { imageId, productId: target.productId };

/** Los destinos posibles de unos productos buscados a mano: cada producto y, si tiene variantes, cada una. */
export function targetsOfProducts(products: readonly ProductEntity[]): ImageTarget[] {
  return products.flatMap((product) => {
    const parent: ImageTarget = { kind: 'PRODUCT', productId: product.id, variantId: null, productName: product.name, sku: product.baseSku || null, attributes: [] };
    if (product.type !== ProductType.VARIABLE) return [parent];
    return [
      parent,
      ...product.variants.map((variant): ImageTarget => ({ kind: 'VARIANT', productId: product.id, variantId: variant.id, productName: product.name, sku: variant.sku, attributes: variant.attributes.map((attribute) => attribute.value) })),
    ];
  });
}
