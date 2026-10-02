import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { ProductListTab } from './ProductListTab';
import { BulkImportModal } from './BulkImportModal';
import { FileSpreadsheet } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { APP_PERMISSIONS } from '@/constants/permissions';

interface ProductsListViewProps {
  selectedBranchId: string;
  uploadedImages: any[];
}

export const ProductsListView: React.FC<ProductsListViewProps> = ({
  selectedBranchId,
  uploadedImages,
}) => {
  const { can } = usePermissions();
  const canImport = can(APP_PERMISSIONS.PRODUCTS_IMPORT);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);

  const { products, meta, isLoading: isLoadingProducts } = useProducts({ page, limit, search });
  const { categories } = useCategories();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-secondary">Catálogo General de Productos</h3>
          <p className="text-xs text-neutral mt-0.5">Gestiona tus artículos, precios, stock y capas de costo por sucursales.</p>
        </div>
        {canImport && (
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 text-xs text-primary font-bold border border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm self-start sm:self-center"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Importar Excel
          </button>
        )}
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
      />

      <BulkImportModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
      />
    </div>
  );
};

export default ProductsListView;
