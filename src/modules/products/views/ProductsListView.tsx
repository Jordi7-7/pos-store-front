import React, { useState } from 'react';
import { useProductList } from '../hooks/useProductList';
import { useCategories } from '../hooks/useCategories';
import { ProductListTab } from '../components/ProductListTab';
import { ProductType } from '../enums';

export interface ProductsListViewProps {
  selectedBranchId: string;
  uploadedImages?: any[];
}

export const ProductsListView: React.FC<ProductsListViewProps> = ({
  selectedBranchId,
  uploadedImages,
}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [productType, setProductType] = useState<ProductType | undefined>(undefined);

  const { products, meta, isLoading: isLoadingProducts } = useProductList({
    page,
    limit,
    search,
    type: productType,
  });
  const { categories } = useCategories();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-secondary">Catálogo General de Productos</h3>
          <p className="text-xs text-neutral mt-0.5">Gestiona tus artículos, precios, stock y capas de costo por sucursales.</p>
        </div>
      </div>

      <ProductListTab
        products={products}
        isLoading={isLoadingProducts}
        categories={categories}
        uploadedImages={uploadedImages}
        selectedBranchId={selectedBranchId}
        meta={meta}
        onPageChange={setPage}
        onLimitChange={(nextLimit) => { setLimit(nextLimit); setPage(1); }}
        search={search}
        onSearchChange={setSearch}
        productType={productType}
        onProductTypeChange={(type) => {
          setProductType(type);
          setPage(1);
        }}
      />
    </div>
  );
};

export default ProductsListView;
