import React from 'react';
import { ArrowDownToLine, ArrowUpFromLine, ChevronDown, ArrowLeftRight, ClipboardCheck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePermissions } from '@/hooks/usePermissions';
import { APP_PERMISSIONS } from '@/constants/permissions';
import { PageHeader } from '@/shared/presentation/components/PageHeader';
import { InventoryDocumentKind } from '../../../domain/enums';
import { ProductMovementsTab } from '../ProductMovementsTab';

export interface ProductMovementsViewProps {
  selectedBranchId: string;
  /** Abre el formulario de una entrada o salida manual. */
  onNewMovement: (kind: InventoryDocumentKind) => void;
}

export const ProductMovementsView: React.FC<ProductMovementsViewProps> = ({ selectedBranchId, onNewMovement }) => {
  const { can } = usePermissions();
  const canEnter = can(APP_PERMISSIONS.PRODUCTS_STOCK_ENTRY);
  const canExit = can(APP_PERMISSIONS.PRODUCTS_STOCK_EXIT);
  const canCount = can(APP_PERMISSIONS.PRODUCTS_STOCK_COUNT);
  const canTransfer = can(APP_PERMISSIONS.PRODUCTS_STOCK_TRANSFER);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Movimientos de inventario"
        description="Todo lo que entra y sale de tus sucursales: compras, ventas, devoluciones y movimientos manuales."
        actions={
          (canEnter || canExit || canCount || canTransfer) && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button id="new-movement">
                    <Plus />
                    Nuevo movimiento
                    <ChevronDown />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                {canEnter && (
                  <DropdownMenuItem onClick={() => onNewMovement(InventoryDocumentKind.ENTRY)} className="gap-2 py-2 text-xs font-medium">
                    <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
                    Entrada de inventario
                  </DropdownMenuItem>
                )}
                {canExit && (
                  <DropdownMenuItem onClick={() => onNewMovement(InventoryDocumentKind.EXIT)} className="gap-2 py-2 text-xs font-medium">
                    <ArrowUpFromLine className="h-4 w-4 text-rose-500" />
                    Salida de inventario
                  </DropdownMenuItem>
                )}
                {canTransfer && (
                  <DropdownMenuItem onClick={() => onNewMovement(InventoryDocumentKind.TRANSFER)} className="gap-2 py-2 text-xs font-medium">
                    <ArrowLeftRight className="h-4 w-4 text-violet-500" />
                    Traslado entre sucursales
                  </DropdownMenuItem>
                )}
                {canCount && (
                  <DropdownMenuItem onClick={() => onNewMovement(InventoryDocumentKind.COUNT)} className="gap-2 py-2 text-xs font-medium">
                    <ClipboardCheck className="h-4 w-4 text-sky-500" />
                    Conteo físico
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      />
      <ProductMovementsTab selectedBranchId={selectedBranchId} />
    </div>
  );
};

export default ProductMovementsView;
