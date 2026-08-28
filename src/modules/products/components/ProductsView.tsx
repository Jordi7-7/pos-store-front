import React, { useState } from 'react';
import { useProducts, useCreateProduct } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductListTab } from './ProductListTab';
import { ProductCreateTab } from './ProductCreateTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Layers, FileSpreadsheet } from 'lucide-react';
import { BulkImportModal } from './BulkImportModal';

interface ProductsViewProps {
  selectedBranchId: string;
  uploadedImages: any[];
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  selectedBranchId,
  uploadedImages
}) => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [isImportOpen, setIsImportOpen] = useState(false);

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
        <button
          type="button"
          onClick={() => setIsImportOpen(true)}
          className="flex items-center gap-1.5 text-xs text-primary font-bold border border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm self-start sm:self-center"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Importar Excel
        </button>
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
        </TabsList>

        <TabsContent value="list">
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

      </Tabs>

      <BulkImportModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
      />
    </div>
  );
};
export default ProductsView;
