import React, { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { useProductMutations } from '../hooks';
import { ProductCreateTab } from '../components/ProductCreateTab';
import { BulkImportModal } from '../components/BulkImportModal';
import { FileSpreadsheet } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { APP_PERMISSIONS } from '@/constants/permissions';

export interface ProductCreateViewProps {
  selectedBranchId: string;
  uploadedImages?: any[];
  onSuccess?: () => void;
}

export const ProductCreateView: React.FC<ProductCreateViewProps> = ({
  selectedBranchId,
  uploadedImages,
  onSuccess,
}) => {
  const { can } = usePermissions();
  const canCreate = can(APP_PERMISSIONS.PRODUCTS_CREATE);
  const canImport = can(APP_PERMISSIONS.PRODUCTS_IMPORT);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const { categories } = useCategories();
  const { createSimpleProduct } = useProductMutations();

  if (!canCreate) {
    return (
      <div className="p-8 text-center bg-card/40 border border-border-card rounded-2xl">
        <h4 className="text-sm font-semibold text-rose-400">Acceso Restringido</h4>
        <p className="text-xs text-neutral mt-1">No posees permisos para registrar nuevos productos en el inventario.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-secondary">Registrar Nuevo Producto</h3>
          <p className="text-xs text-neutral mt-0.5">
            Crea un nuevo artículo con código de barras, precios por sucursal y capas de costo.
          </p>
        </div>
        {canImport && (
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 text-xs text-primary font-bold border border-primary/20 hover:border-primary/40 bg-primary/5 hover:bg-primary/10 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm self-start sm:self-center"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importar Excel</span>
          </button>
        )}
      </div>

      <ProductCreateTab
        categories={categories}
        uploadedImages={uploadedImages}
        selectedBranchId={selectedBranchId}
        createSimpleProduct={createSimpleProduct}
        onSuccess={onSuccess || (() => {})}
      />

      <BulkImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        selectedBranchId={selectedBranchId}
      />
    </div>
  );
};

export default ProductCreateView;
