import React from 'react';
import { Sliders, Store, Eye } from 'lucide-react';
import { BarcodeLabel } from './BarcodeLabel';
import type { BarcodeLabelItem } from './types';

interface BarcodePreviewPanelProps {
  storeName: string;
  onStoreNameChange: (name: string) => void;
  activeItem?: BarcodeLabelItem;
}

export const BarcodePreviewPanel: React.FC<BarcodePreviewPanelProps> = ({
  storeName,
  onStoreNameChange,
  activeItem,
}) => {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Configuración de Cabecera */}
      <div className="bg-card border border-border/80 rounded-xl p-3.5 space-y-2.5 shrink-0">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
          <Sliders className="w-3.5 h-3.5 text-primary" />
          <span>Cabecera del Sticker</span>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
            Nombre en la franja negra
          </label>
          <div className="relative">
            <Store className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={storeName}
              onChange={(e) => onStoreNameChange(e.target.value.toUpperCase())}
              placeholder="NOMBRE TIENDA"
              className="w-full pl-8 pr-3 py-1.5 text-xs font-bold bg-background border border-border rounded-lg uppercase focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Vista Previa en Vivo */}
      <div className="flex-1 flex flex-col border border-border/80 rounded-xl bg-muted/20 p-4 items-center justify-center min-h-[220px]">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4">
          <Eye className="w-4 h-4" />
          <span>Vista Previa Escala Real (50×30 mm)</span>
        </div>

        {activeItem ? (
          <div className="p-2 bg-white rounded-xl shadow-lg border border-neutral-300">
            <BarcodeLabel
              storeName={storeName}
              sku={activeItem.sku}
              name={activeItem.name}
              price={activeItem.price}
            />
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic">No hay producto seleccionado</div>
        )}

        <p className="mt-4 text-[10px] text-muted-foreground text-center max-w-[240px] leading-relaxed">
          Diseño térmico optimizado para etiquetas adhesivas estándar de 50×30 mm.
        </p>
      </div>
    </div>
  );
};
