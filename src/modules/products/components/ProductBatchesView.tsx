import React from 'react';
import { ProductBatchesTab } from './ProductBatchesTab';

interface ProductBatchesViewProps {
  selectedBranchId: string;
}

export const ProductBatchesView: React.FC<ProductBatchesViewProps> = ({
  selectedBranchId,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-secondary">Historial de Lotes de Inventario</h3>
        <p className="text-xs text-neutral mt-0.5">
          Consulta las capas de costo, stock inicial, compras y devoluciones registradas en inventario.
        </p>
      </div>

      <ProductBatchesTab selectedBranchId={selectedBranchId} />
    </div>
  );
};

export default ProductBatchesView;
