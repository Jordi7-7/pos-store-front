import React from 'react';
import { ProductsListView } from './ProductsListView';
import { ProductBatchesView } from './ProductBatchesView';
import { ProductCreateView } from './ProductCreateView';

interface ProductsViewProps {
  selectedBranchId: string;
  uploadedImages: any[];
  activeSubTab?: 'list' | 'batches' | 'create';
  onSubTabChange?: (subTab: 'list' | 'batches' | 'create') => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  selectedBranchId,
  uploadedImages,
  activeSubTab = 'list',
  onSubTabChange,
}) => {
  switch (activeSubTab) {
    case 'batches':
      return <ProductBatchesView selectedBranchId={selectedBranchId} />;

    case 'create':
      return (
        <ProductCreateView
          selectedBranchId={selectedBranchId}
          uploadedImages={uploadedImages}
          onSuccess={() => onSubTabChange?.('list')}
        />
      );

    case 'list':
    default:
      return (
        <ProductsListView
          selectedBranchId={selectedBranchId}
          uploadedImages={uploadedImages}
        />
      );
  }
};

export default ProductsView;
