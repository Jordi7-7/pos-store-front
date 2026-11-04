import React from 'react';
import { Sliders, Store, Eye, Tag } from 'lucide-react';
import { BarcodeLabel } from './BarcodeLabel';
import type { BarcodeLabelItem } from './types';
import { ZEBRA_LABEL_PRESETS } from '../../services/label-builder';

interface BarcodePreviewPanelProps {
  storeName: string;
  onStoreNameChange: (name: string) => void;
  activeItem?: BarcodeLabelItem;
  widthMm?: number;
  heightMm?: number;
  onSelectDimensions?: (width: number, height: number) => void;
}

export const BarcodePreviewPanel: React.FC<BarcodePreviewPanelProps> = ({
  storeName,
  onStoreNameChange,
  activeItem,
  widthMm = 50,
  heightMm = 30,
  onSelectDimensions,
}) => {
  return (
    <div className="flex flex-col gap-3.5 h-full">
      {/* Configuración de Cabecera y Tamaño Rápido */}
      <div className="bg-card border border-border/80 rounded-xl p-3.5 space-y-3 shrink-0">
        <div className="flex items-center justify-between text-xs font-bold text-foreground uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-primary" />
            <span>Cabecera</span>
          </div>
          <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            {widthMm} × {heightMm} mm
          </span>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
            Nombre en la franja negra
          </label>
          <div className="relative">
            <Store className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              type="text"
              value={storeName}
              onChange={(e) => onStoreNameChange(e.target.value.toUpperCase())}
              placeholder="NOMBRE TIENDA"
              className="w-full pl-8 pr-3 py-1.5 text-xs font-bold bg-background border border-border rounded-lg uppercase focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Selector rápido de medidas estándar Zebra */}
        {onSelectDimensions && (
          <div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-bold mb-1.5">
              <Tag className="w-3 h-3 text-muted-foreground" />
              <span>Tamaño de Etiqueta (Zebra / Térmica)</span>
            </div>
            <select
              value={`${widthMm}x${heightMm}`}
              onChange={(e) => {
                const [w, h] = e.target.value.split('x').map(Number);
                if (w && h) onSelectDimensions(w, h);
              }}
              className="w-full text-xs font-semibold bg-background border border-border rounded-lg py-1.5 px-2.5 focus:outline-none focus:border-primary cursor-pointer text-foreground"
            >
              {ZEBRA_LABEL_PRESETS.map((p) => (
                <option key={p.id} value={`${p.widthMm}x${p.heightMm}`}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Vista Previa en Vivo 100% WYSIWYG a 203 DPI */}
      <div className="flex-1 flex flex-col border border-border/80 rounded-xl bg-muted/20 p-4 items-center justify-center min-h-[220px]">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
          <Eye className="w-4 h-4 text-primary" />
          <span>Vista Real ({widthMm} × {heightMm} mm)</span>
        </div>

        {activeItem ? (
          <div className="p-2 bg-white rounded-xl shadow-lg border border-neutral-300 max-w-full flex items-center justify-center">
            <BarcodeLabel
              storeName={storeName}
              sku={activeItem.sku}
              name={activeItem.name}
              price={activeItem.price}
              widthMm={widthMm}
              heightMm={heightMm}
            />
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic">No hay producto seleccionado</div>
        )}

        <p className="mt-3 text-[10px] text-muted-foreground text-center max-w-[260px] leading-relaxed">
          Renderizado exacto a <strong>203 DPI</strong>. La imagen enviada a la impresora será 100% idéntica a esta vista.
        </p>
      </div>
    </div>
  );
};
