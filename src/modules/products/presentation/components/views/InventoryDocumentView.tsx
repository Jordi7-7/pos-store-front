import React from 'react';
import { PageHeader } from '@/shared/presentation/components/PageHeader';
import { InventoryDocumentKind } from '../../../domain/enums';
import type { LinesKind } from '../../../domain/rules/inventory-document-lines';
import { BackToMovementsButton } from '../movements/BackToMovementsButton';
import { InventoryDocumentForm } from '../movements/InventoryDocumentForm';

export interface InventoryDocumentViewProps {
  kind: LinesKind;
  selectedBranchId: string;
  destinationOptions?: readonly { id: string; name: string }[];
  onCreated: () => void;
  /** Vuelve al historial de movimientos sin registrar nada. */
  onBack: () => void;
}

const TITLES: Record<LinesKind, { title: string; description: string }> = {
  [InventoryDocumentKind.ENTRY]: { title: 'Entrada de inventario', description: 'Registra mercancía que entra a la sucursal sin una compra.' },
  [InventoryDocumentKind.EXIT]: { title: 'Salida de inventario', description: 'Registra mercancía que sale de la sucursal sin una venta.' },
  [InventoryDocumentKind.TRANSFER]: { title: 'Traslado entre sucursales', description: 'Mueve mercancía de la sucursal elegida a otra, al instante.' },
};

export const InventoryDocumentView: React.FC<InventoryDocumentViewProps> = ({ kind, selectedBranchId, destinationOptions, onCreated, onBack }) => (
  <div className="space-y-6">
    <PageHeader title={TITLES[kind].title} description={TITLES[kind].description} actions={<BackToMovementsButton onClick={onBack} />} />
    {/* `key`: al cambiar de sucursal el formulario empieza de cero; sus líneas guardan la existencia de la sucursal anterior */}
    <InventoryDocumentForm key={selectedBranchId} kind={kind} branchId={selectedBranchId} destinationOptions={destinationOptions} onCreated={onCreated} />
  </div>
);
