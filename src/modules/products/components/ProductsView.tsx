import React, { useState } from 'react';
import { useProducts, useCreateProduct } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductListTab } from './ProductListTab';
import { ProductCreateTab } from './ProductCreateTab';
import { KardexTab } from './KardexTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Layers, ClipboardList } from 'lucide-react';

interface ProductsViewProps {
  selectedBranchId: string;
  uploadedImages: any[];
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  selectedBranchId,
  uploadedImages
}) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list');

  const { products, meta, isLoading: isLoadingProducts } = useProducts({ page, limit, search });
  const { categories } = useCategories();
  const { createSimpleProduct } = useCreateProduct();

  const handleProductCreated = () => {
    setActiveTab('list');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-secondary">Catálogo General de Productos</h3>
          <p className="text-xs text-neutral mt-0.5">Gestiona tus artículos, precios y stock por sucursales.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="list" className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Crear Producto
          </TabsTrigger>
          <TabsTrigger value="kardex" className="flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" />
            Kardex / Existencias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <ProductListTab
            products={products}
            isLoading={isLoadingProducts}
            categories={categories}
            uploadedImages={uploadedImages}
            selectedBranchId={selectedBranchId}
            meta={meta}
            page={page}
            onPageChange={setPage}
            search={search}
            onSearchChange={setSearch}
          />
        </TabsContent>

        <TabsContent value="create">
          <ProductCreateTab
            categories={categories}
            uploadedImages={uploadedImages}
            selectedBranchId={selectedBranchId}
            createSimpleProduct={createSimpleProduct}
            onSuccess={handleProductCreated}
          />
        </TabsContent>

        <TabsContent value="kardex">
          <KardexTab
            products={products}
            isLoadingProducts={isLoadingProducts}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default ProductsView;
