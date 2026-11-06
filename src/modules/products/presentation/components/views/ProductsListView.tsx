import React, { useState } from 'react';
import { useProductList } from '../../hooks/useProductList';
import { useCategories } from '../../hooks/useCategories';
import { ProductListTab } from '../ProductListTab';
import { ProductType } from '../../../domain/enums';
import { PageHeader } from '@/shared/presentation/components/PageHeader';

export interface ProductsListViewProps {
  selectedBranchId: string;
}

export const ProductsListView: React.FC<ProductsListViewProps> = ({
  selectedBranchId,
}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [productType, setProductType] = useState<ProductType | undefined>(undefined);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  const { products, meta, isLoading: isLoadingProducts } = useProductList({
    page,
    limit,
    search,
    type: productType,
    branchId: selectedBranchId || undefined,
    inStockOnly,
  });
  const { categories } = useCategories();

  return (
    <div className="space-y-6">
      <PageHeader title="Productos" description="Gestiona tus artículos, precios, existencias y capas de costo por sucursal." />

      <ProductListTab
        products={products}
        isLoading={isLoadingProducts}
        categories={categories}
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
        inStockOnly={inStockOnly}
        onInStockOnlyChange={(val) => {
          setInStockOnly(val);
          setPage(1);
        }}
      />
    </div>
  );
};

export default ProductsListView;
