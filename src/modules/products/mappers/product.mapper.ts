import type { ProductDTO, ProductVariantDTO } from '../types/product.types';
import type { ProductEntity, ProductVariantEntity, ProductImageEntity } from '../entities/product.entity';
import { ProductType } from '../enums';

export const toProductVariantEntity = (dto: ProductVariantDTO): ProductVariantEntity => {
  const purchasePrice = Number(dto.purchasePrice || 0);
  const salePrice = Number(dto.salePrice || 0);
  const wholesalePrice = dto.wholesalePrice !== null && dto.wholesalePrice !== undefined
    ? Number(dto.wholesalePrice)
    : null;

  const images = (dto.images || []).map((img) => ({
    id: img.id,
    url: img.url,
    description: img.description || '',
  }));

  const attributes = (dto.attributes || []).map((attr) => ({
    name: attr.name || '',
    value: attr.value || '',
  }));

  const attributesLabel = attributes.map((a) => `${a.name}: ${a.value}`).join(' / ');

  const stocks = (dto.stocks || []).map((st) => ({
    branchId: st.branchId,
    branchName: st.branchName || 'Sucursal',
    quantity: Number(st.quantity || 0),
  }));

  const totalStock = stocks.reduce((acc, s) => acc + s.quantity, 0);

  return {
    id: dto.id || '',
    sku: dto.sku || '',
    barcode: dto.barcode || '',
    purchasePrice,
    purchasePriceFormatted: `$${purchasePrice.toFixed(2)}`,
    salePrice,
    salePriceFormatted: `$${salePrice.toFixed(2)}`,
    wholesalePrice,
    wholesalePriceFormatted: wholesalePrice !== null ? `$${wholesalePrice.toFixed(2)}` : 'N/A',
    images,
    primaryImageUrl: images[0]?.url || '',
    attributes,
    attributesLabel,
    stocks,
    totalStock,
  };
};

export const toProductEntity = (dto: ProductDTO): ProductEntity => {
  const variants = (dto.variants || []).map(toProductVariantEntity);

  const images: ProductImageEntity[] = (dto.images || []).map((img) => ({
    id: img.id,
    url: img.url,
    description: img.description || '',
  }));

  const primaryImageUrl = images[0]?.url || variants[0]?.primaryImageUrl || '';

  const totalStock = variants.reduce((acc, v) => acc + v.totalStock, 0);

  const formatRange = (values: number[]) => {
    const valid = values.filter((p) => p > 0);
    if (valid.length === 0) return '—';
    const min = Math.min(...valid);
    const max = Math.max(...valid);
    return min === max ? `$${min.toFixed(2)}` : `$${min.toFixed(2)} - $${max.toFixed(2)}`;
  };

  const salePrices = variants.map((v) => v.salePrice);
  const purchasePrices = variants.map((v) => v.purchasePrice);
  const wholesalePrices = variants
    .map((v) => v.wholesalePrice)
    .filter((p): p is number => p !== null && p !== undefined);

  const validSalePrices = salePrices.filter((p) => p > 0);
  const minPrice = validSalePrices.length > 0 ? Math.min(...validSalePrices) : 0;
  const maxPrice = validSalePrices.length > 0 ? Math.max(...validSalePrices) : 0;

  const priceRangeFormatted = formatRange(salePrices);
  const purchasePriceRangeFormatted = formatRange(purchasePrices);
  const wholesalePriceRangeFormatted = formatRange(wholesalePrices);

  return {
    id: dto.id,
    name: dto.name || 'Sin nombre',
    description: dto.description || '',
    type: dto.type || ProductType.SIMPLE,
    baseSku: dto.baseSku || '',
    categoryId: dto.categoryId || null,
    categoryName: dto.categoryName || dto.category?.name || 'Sin categoría',
    images,
    primaryImageUrl,
    variants,
    totalVariants: variants.length,
    totalStock,
    minPrice,
    maxPrice,
    priceRangeFormatted,
    purchasePriceRangeFormatted,
    wholesalePriceRangeFormatted,
  };
};

export const toProductEntities = (dtos: ProductDTO[]): ProductEntity[] => dtos.map(toProductEntity);
