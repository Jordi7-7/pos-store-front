import type { ProductDTO, ProductVariantDTO } from '../dtos/product.dto';
import type { CreatedVariantEntity } from '../../domain/entities/catalog.entity';
import type { ProductEntity, ProductVariantEntity, ProductImageEntity } from '../../domain/entities/product.entity';
import { ProductType } from '../../domain/enums';

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
    salePrice,
    wholesalePrice,
    images,
    primaryImageUrl: images[0]?.url || '',
    attributes,
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

  const validSalePrices = variants.map((v) => v.salePrice).filter((p) => p > 0);
  const minPrice = validSalePrices.length > 0 ? Math.min(...validSalePrices) : 0;
  const maxPrice = validSalePrices.length > 0 ? Math.max(...validSalePrices) : 0;

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
  };
};

export const toProductEntities = (dtos: ProductDTO[]): ProductEntity[] => dtos.map(toProductEntity);

/** La respuesta de crear una variante trae los valores de atributo con el nombre del atributo anidado. */
export const toCreatedVariantEntity = (dto: ProductVariantDTO): CreatedVariantEntity => ({
  id: String(dto.id ?? ''),
  sku: dto.sku,
  barcode: dto.barcode || '',
  purchasePrice: Number(dto.purchasePrice) || 0,
  salePrice: Number(dto.salePrice) || 0,
  wholesalePrice: dto.wholesalePrice !== null && dto.wholesalePrice !== undefined ? Number(dto.wholesalePrice) : null,
  attributes: (dto.attributeValues || []).map((value: { attribute?: { name?: string }; value: string }) => ({
    name: value.attribute?.name || 'Atributo',
    value: value.value,
  })),
  images: (dto.images || []).map((image) => ({ id: image.id, url: image.url || '', description: image.description })),
});
