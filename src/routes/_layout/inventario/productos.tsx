import { createFileRoute } from '@tanstack/react-router';
import { ProductsListView } from '@/modules/products';
import { useLayoutContext } from '@/providers/LayoutContext';
import { useMediaUpload } from '@/modules/media';

export const Route = createFileRoute('/_layout/inventario/productos')({
  component: InventoryProductsRoute,
});

function InventoryProductsRoute() {
  const { selectedBranchId } = useLayoutContext();
  const { uploadedImages } = useMediaUpload();

  return (
    <ProductsListView
      selectedBranchId={selectedBranchId || ''}
      uploadedImages={uploadedImages}
    />
  );
}
