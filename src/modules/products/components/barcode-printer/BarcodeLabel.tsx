import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeLabelProps {
  storeName?: string;
  sku: string;
  name: string;
  price: number;
}

export const BarcodeLabel: React.FC<BarcodeLabelProps> = ({
  storeName = 'LEIZA STORE',
  sku,
  name,
  price,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && sku) {
      try {
        const cleanSku = sku.trim();
        // Ajuste dinámico de ancho de barras según la longitud del SKU:
        // SKUs cortos (<= 8 chars): 1.4
        // SKUs medianos (9-12 chars): 1.15
        // SKUs largos (> 12 chars): 0.95 - 1.05
        let barWidth = 1.35;
        let fontSize = 10;
        if (cleanSku.length > 14) {
          barWidth = 0.95;
          fontSize = 8;
        } else if (cleanSku.length > 10) {
          barWidth = 1.1;
          fontSize = 9;
        } else if (cleanSku.length > 8) {
          barWidth = 1.25;
          fontSize = 9.5;
        }

        JsBarcode(svgRef.current, cleanSku, {
          format: 'CODE128',
          width: barWidth,
          height: 22,
          displayValue: true,
          fontSize: fontSize,
          font: 'monospace',
          fontOptions: 'bold',
          textMargin: 1,
          margin: 0,
        });
      } catch (err) {
        console.error('Error generando código de barras para SKU:', sku, err);
      }
    }
  }, [sku]);

  return (
    <div
      className="barcode-sticker bg-white text-black font-sans flex flex-col justify-between items-center select-none overflow-hidden"
      style={{
        width: '50mm',
        height: '29.5mm',
        maxHeight: '29.5mm',
        padding: '1mm 2mm',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Header con fondo negro invertido */}
      <div 
        className="w-full text-center py-0.5 px-1 font-black text-[10px] leading-none tracking-wider uppercase truncate rounded-[2px]"
        style={{
          backgroundColor: '#000000',
          color: '#ffffff',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
          letterSpacing: '0.06em',
        }}
      >
        {storeName}
      </div>

      {/* 2. Código de barras con el SKU debajo */}
      <div className="flex-1 flex flex-col items-center justify-center w-full min-h-0 overflow-hidden my-0.5">
        <svg ref={svgRef} className="max-w-full max-h-[14mm] object-contain" />
      </div>

      {/* 3. Nombre del producto */}
      <div className="w-full text-center font-bold text-[9px] uppercase leading-none tracking-tight text-black truncate px-0.5 mb-0.5">
        {name}
      </div>

      {/* 4. Precio destacado */}
      <div className="w-full text-center font-black text-[12px] text-black font-serif leading-none tracking-wide pb-0.5">
        PRECIO $ {Math.floor(price) === price ? price : price.toFixed(2)}
      </div>
    </div>
  );
};
