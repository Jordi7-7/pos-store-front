import { productsService } from '../services/products.service';

export const useVariantSearch = () => {
  const findVariantBySku = async (sku: string) => {
    return productsService.getVariantBySku(sku);
  };

  return {
    findVariantBySku,
  };
};
