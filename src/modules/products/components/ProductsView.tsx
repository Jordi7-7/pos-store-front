import React, { useState } from 'react';
import { useProducts, useCreateProduct } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductListTab } from './ProductListTab';
import { ProductCreateTab } from './ProductCreateTab';
import { CategoriesTab } from './CategoriesTab';
import { KardexTab } from './KardexTab';
import { Eye, Layers, Folder, ClipboardList } from 'lucide-react';

interface ProductsViewProps {
  selectedBranchId: string;
  uploadedImages: any[];
}

type TabType = 'list' | 'create' | 'categories' | 'kardex';

export const ProductsView: React.FC<ProductsViewProps> = ({
  selectedBranchId,
  uploadedImages
}) => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');

  const { products, meta, isLoading: isLoadingProducts } = useProducts({ page, limit, search });
  const { categories } = useCategories();
  const { createSimpleProduct } = useCreateProduct();


  const [activeTab, setActiveTab] = useState<TabType>('list');

  const handleProductCreated = () => {
    setActiveTab('list');
  };

  return (
    <div className="space-y-6">
      
      {/* Tab Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-card pb-4">
        <div>
          <h3 className="text-sm font-bold text-secondary">Catálogo General de Productos</h3>
          <p className="text-xs text-neutral mt-0.5">Gestiona tus artículos, precios y stock por sucursales.</p>
        </div>

        <div className="flex bg-bg-card border border-border-card rounded-xl p-1 gap-1 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'list' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-neutral hover:text-secondary'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Productos</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'create' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-neutral hover:text-secondary'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Crear Producto</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'categories' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-neutral hover:text-secondary'
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Categorías</span>
          </button>

          <button
            onClick={() => setActiveTab('kardex')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'kardex' 
                ? 'bg-primary text-white shadow-sm' 
                : 'text-neutral hover:text-secondary'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Kardex / Existencias</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'list' && (
        <div className="space-y-6 animate-fade-in">
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
        </div>
      )}

      {activeTab === 'create' && (
        <ProductCreateTab 
          categories={categories}
          uploadedImages={uploadedImages}
          selectedBranchId={selectedBranchId}
          createSimpleProduct={createSimpleProduct}
          onSuccess={handleProductCreated}
        />
      )}

      {activeTab === 'categories' && (
        <CategoriesTab />
      )}

      {activeTab === 'kardex' && (
        <KardexTab 
          products={products}
          isLoadingProducts={isLoadingProducts}
        />
      )}

    </div>
  );
};
export default ProductsView;

