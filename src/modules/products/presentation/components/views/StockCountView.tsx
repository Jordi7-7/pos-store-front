import React from 'react';
import { PageHeader } from '@/shared/presentation/components/PageHeader';
import { BackToMovementsButton } from '../movements/BackToMovementsButton';
import { StockCountForm } from '../movements/StockCountForm';

export interface StockCountViewProps {
  selectedBranchId: string;
  onCreated: () => void;
  /** Vuelve al historial de movimientos sin registrar nada. */
  onBack: () => void;
}

export const StockCountView: React.FC<StockCountViewProps> = ({ selectedBranchId, onCreated, onBack }) => (
  <div className="space-y-6">
    <PageHeader title="Conteo físico" description="Corrige las existencias de la sucursal con lo que contaste en el almacén." actions={<BackToMovementsButton onClick={onBack} />} />
    {/* `key`: al cambiar de sucursal el conteo empieza de cero; lo esperado y lo contado eran de la sucursal anterior */}
    <StockCountForm key={selectedBranchId} branchId={selectedBranchId} onCreated={onCreated} />
  </div>
);
