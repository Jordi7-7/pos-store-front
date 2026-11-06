import React, { useState } from 'react';
import { useCategories } from '../../hooks/useCategories';
import { useProductMutations } from '../../hooks';
import { ProductCreateTab } from '../ProductCreateTab';
import { BulkImportModal } from '../BulkImportModal';
import { FileSpreadsheet } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { APP_PERMISSIONS } from '@/constants/permissions';
import { PageHeader } from '@/shared/presentation/components/PageHeader';
import { Button } from '@/components/ui/button';

export interface ProductCreateViewProps {
  selectedBranchId: string;
  onSuccess?: () => void;
}

export const ProductCreateView: React.FC<ProductCreateViewProps> = ({
  selectedBranchId,
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
      <PageHeader
        title="Crear producto"
        description="Registra un artículo con código de barras, precios y existencias iniciales."
        actions={
          canImport && (
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <FileSpreadsheet />
              Importar Excel
            </Button>
          )
        }
      />

      <ProductCreateTab
        categories={categories}
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
