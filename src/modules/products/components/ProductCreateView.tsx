import React from 'react';
import { useCategories } from '../hooks/useCategories';
import { useCreateSimpleProduct } from '../hooks/useProducts';
import { ProductCreateTab } from './ProductCreateTab';
import { usePermissions } from '@/hooks/usePermissions';
import { APP_PERMISSIONS } from '@/constants/permissions';

interface ProductCreateViewProps {
  selectedBranchId: string;
  uploadedImages: any[];
  onSuccess?: () => void;
}

export const ProductCreateView: React.FC<ProductCreateViewProps> = ({
  selectedBranchId,
  uploadedImages,
  onSuccess,
}) => {
  const { can } = usePermissions();
  const canCreate = can(APP_PERMISSIONS.PRODUCTS_CREATE);

  const { categories } = useCategories();
  const { createSimpleProduct } = useCreateSimpleProduct();

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
      <div>
        <h3 className="text-sm font-bold text-secondary">Registrar Nuevo Producto</h3>
        <p className="text-xs text-neutral mt-0.5">
          Crea un nuevo artículo con código de barras, precios por sucursal y capas de costo.
        </p>
      </div>

      <ProductCreateTab
        categories={categories}
        uploadedImages={uploadedImages}
        selectedBranchId={selectedBranchId}
        createSimpleProduct={createSimpleProduct}
        onSuccess={onSuccess || (() => {})}
      />
    </div>
  );
};

export default ProductCreateView;
