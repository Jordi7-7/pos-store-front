import React, { useState } from 'react';
import { ScanBarcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarcodeScannerDialog, type ScanResponse } from './BarcodeScannerDialog';

interface ScanButtonProps {
  onDetected: (code: string) => ScanResponse | Promise<ScanResponse>;
  continuous?: boolean;
  title?: string;
  className?: string;
  /** Texto junto al icono; sin él, solo el icono. */
  label?: string;
}

/** Botón que abre el escáner de la cámara. Se pone junto a cualquier campo donde se escribe un SKU o código. */
export const ScanButton: React.FC<ScanButtonProps> = ({ onDetected, continuous, title, className, label }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" size={label ? 'default' : 'icon'} onClick={() => setOpen(true)} aria-label="Escanear con la cámara" title="Escanear con la cámara del dispositivo" className={className}>
        <ScanBarcode />
        {label}
      </Button>
      <BarcodeScannerDialog open={open} onOpenChange={setOpen} onDetected={onDetected} continuous={continuous} title={title} />
    </>
  );
};
