import { productsRepository } from '../../infrastructure/dependencies';

export const useVariantSearch = () => ({
  findVariantBySku: (sku: string) => productsRepository.findVariantBySku(sku),
  /** Búsqueda del POS: variantes que coinciden, o el producto variable si el código es su SKU base. */
  searchPos: (sku: string, branchId: string) => productsRepository.searchPos(sku, branchId),
});
