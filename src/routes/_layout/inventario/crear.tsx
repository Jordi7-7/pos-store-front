import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router';
import { ProductCreateView } from '@/modules/products';
import { useLayoutContext } from '@/providers/LayoutContext';
import { useMediaUpload } from '@/modules/media';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import { APP_PERMISSIONS } from '@/constants/permissions';
import { toast } from 'sonner';

export const Route = createFileRoute('/_layout/inventario/crear')({
  beforeLoad: () => {
    const auth = useAuthStore.getState();
    if (!auth.can(APP_PERMISSIONS.PRODUCTS_CREATE)) {
      toast.error('Acceso denegado: No tienes permiso para crear productos');
      throw redirect({
        to: '/inventario/productos',
      });
    }
  },
  component: InventoryCreateRoute,
});

function InventoryCreateRoute() {
  const navigate = useNavigate();
  const { selectedBranchId } = useLayoutContext();
  const { uploadedImages } = useMediaUpload();

  return (
    <ProductCreateView
      selectedBranchId={selectedBranchId || ''}
      uploadedImages={uploadedImages}
      onSuccess={() => {
        navigate({
          to: '/inventario/productos',
        });
      }}
    />
  );
}
