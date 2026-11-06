import React from 'react';
import { ProductBatchesTab } from '../ProductBatchesTab';
import { PageHeader } from '@/shared/presentation/components/PageHeader';

export interface ProductBatchesViewProps {
  selectedBranchId: string;
}

export const ProductBatchesView: React.FC<ProductBatchesViewProps> = ({
  selectedBranchId,
}) => {
  return (
    <div className="space-y-6">
      <PageHeader title="Lotes de inventario" description="Consulta las capas de costo, el stock inicial, las compras y las devoluciones registradas." />

      <ProductBatchesTab selectedBranchId={selectedBranchId} />
    </div>
  );
};

export default ProductBatchesView;
