import { CatalogHttpRepository } from './repositories/catalog.http-repository';
import { InventoryHttpRepository } from './repositories/inventory.http-repository';
import { ProductsHttpRepository } from './repositories/products.http-repository';

/** Raíz de composición del módulo. */
export const productsRepository = new ProductsHttpRepository();
export const catalogRepository = new CatalogHttpRepository();
export const inventoryRepository = new InventoryHttpRepository();
