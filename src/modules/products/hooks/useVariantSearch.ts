import { productsService } from '../services/products.service';

export const useVariantSearch = () => {
  const findVariantBySku = async (sku: string) => {
    return productsService.getVariantBySku(sku);
  };

  const findPosVariantBySku = async (sku: string, branchId: string) => {
    return productsService.getPosVariantBySku(sku, branchId);
  };

  return {
    findVariantBySku,
    findPosVariantBySku,
  };
};

