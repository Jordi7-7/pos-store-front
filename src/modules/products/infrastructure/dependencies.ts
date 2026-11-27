import { uploadImage } from '@/modules/media/infrastructure/dependencies';
import { UploadProductImages } from '../application/use-cases/upload-product-images';
import { BrowserImageCompressor } from '@/shared/infrastructure/images/browser-image-compressor';
import { CatalogHttpRepository } from './repositories/catalog.http-repository';
import { InventoryHttpRepository } from './repositories/inventory.http-repository';
import { ProductsHttpRepository } from './repositories/products.http-repository';

/** Raíz de composición del módulo. */
export const productsRepository = new ProductsHttpRepository();
export const catalogRepository = new CatalogHttpRepository();
export const inventoryRepository = new InventoryHttpRepository();
export const uploadProductImages = new UploadProductImages(new BrowserImageCompressor(), uploadImage, productsRepository);
