import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Vuelve al historial de movimientos desde un formulario (entrada, salida, traslado o conteo). */
export const BackToMovementsButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <Button type="button" variant="outline" onClick={onClick}>
    <ArrowLeft />
    Volver a movimientos
  </Button>
);
