// API pública del módulo.
export * from './domain/enums';
export type { ProductEntity, ProductVariantEntity, ProductImageEntity } from './domain/entities/product.entity';
export type { ProductVM, ProductVariantVM } from './presentation/view-models/product.vm';
export type { PosSearchResult, PosVariantEntity, PosVariableProductEntity } from './domain/entities/catalog.entity';
export * from './presentation/hooks';
export * from './presentation/components/views';
export * from './presentation/components';
