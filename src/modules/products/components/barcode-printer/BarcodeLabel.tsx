import React, { useMemo } from 'react';
import { renderLabelToPng203Dpi } from './ThermalPrintOutput';

interface BarcodeLabelProps {
  storeName?: string;
  sku: string;
  name: string;
  price: number;
  widthMm?: number;
  heightMm?: number;
}

export const BarcodeLabel: React.FC<BarcodeLabelProps> = ({
  storeName = 'MI TIENDA',
  sku,
  name,
  price,
  widthMm = 50,
  heightMm = 30,
}) => {
  // Genera en vivo la imagen fija a 203 DPI para que la vista previa sea exactamente 1:1 con la física
  const pngDataUrl = useMemo(() => {
    return renderLabelToPng203Dpi(
      { sku, name, price, quantity: 1 },
      storeName,
      widthMm,
      heightMm
    );
  }, [sku, name, price, storeName, widthMm, heightMm]);

  return (
    <div
      className="barcode-sticker bg-white text-black flex flex-col items-center justify-center select-none overflow-hidden rounded-md border border-neutral-300 shadow-sm transition-all"
      style={{
        maxWidth: '100%',
        width: `${Math.min(300, widthMm * 5.5)}px`,
        aspectRatio: `${widthMm} / ${heightMm}`,
      }}
    >
      {pngDataUrl ? (
        <img
          src={pngDataUrl}
          alt={`Etiqueta ${sku}`}
          className="w-full h-full object-contain block"
        />
      ) : (
        <div className="text-xs text-muted-foreground p-4">Cargando etiqueta...</div>
      )}
    </div>
  );
};
