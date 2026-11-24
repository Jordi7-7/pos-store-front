import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useLayoutContext } from '@/providers/LayoutContext';
import { InventoryDocumentKind } from '../../../domain/enums';
import type { LinesKind } from '../../../domain/rules/inventory-document-lines';
import { InventoryDocumentView } from './InventoryDocumentView';
import { ProductMovementsView } from './ProductMovementsView';
import { StockCountView } from './StockCountView';

/** Páginas de las rutas de movimientos de inventario: leen la sucursal elegida y navegan entre sí (las rutas quedan como adaptadores finos). */

const NEW_MOVEMENT_ROUTES = {
  [InventoryDocumentKind.ENTRY]: '/inventario/entrada',
  [InventoryDocumentKind.EXIT]: '/inventario/salida',
  [InventoryDocumentKind.COUNT]: '/inventario/conteo',
  [InventoryDocumentKind.TRANSFER]: '/inventario/traslado',
} as const;

const useSelectedBranchId = (): string => useLayoutContext().selectedBranchId || '';

export const ProductMovementsPage: React.FC = () => {
  const navigate = useNavigate();
  const selectedBranchId = useSelectedBranchId();

  return (
    <ProductMovementsView
      selectedBranchId={selectedBranchId}
      onNewMovement={(kind) => navigate({ to: NEW_MOVEMENT_ROUTES[kind] })}
    />
  );
};

const InventoryDocumentPage: React.FC<{ kind: LinesKind }> = ({ kind }) => {
  const navigate = useNavigate();
  const { selectedBranchId, branches } = useLayoutContext();
  const goBack = () => navigate({ to: '/inventario/movimientos' });

  return <InventoryDocumentView kind={kind} selectedBranchId={selectedBranchId || ''} destinationOptions={branches} onCreated={goBack} onBack={goBack} />;
};

export const InventoryEntryPage: React.FC = () => <InventoryDocumentPage kind={InventoryDocumentKind.ENTRY} />;
export const InventoryExitPage: React.FC = () => <InventoryDocumentPage kind={InventoryDocumentKind.EXIT} />;
export const InventoryTransferPage: React.FC = () => <InventoryDocumentPage kind={InventoryDocumentKind.TRANSFER} />;

export const StockCountPage: React.FC = () => {
  const navigate = useNavigate();
  const selectedBranchId = useSelectedBranchId();

  const goBack = () => navigate({ to: '/inventario/movimientos' });

  return <StockCountView selectedBranchId={selectedBranchId} onCreated={goBack} onBack={goBack} />;
};
