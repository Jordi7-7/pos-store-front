import React from 'react';
import { AlertTriangle, Eye } from 'lucide-react';
import { LABEL_PRESETS } from '@/modules/printing/domain/rules/label-presets';
import type { LabelPrinterState } from '@/modules/printing/presentation/hooks/useLabelPrinter';
import type { LabelSheet } from '@/modules/printing/domain/rules/label-sheets';
import { labelBarcodeQuality } from '@/modules/printing/infrastructure/labels/label-canvas';
import { BarcodeLabel } from './BarcodeLabel';
import { LabelContentPicker } from './LabelContentPicker';
import type { BarcodeLabelItem } from './types';

interface BarcodePreviewPanelProps {
  printer: LabelPrinterState;
  storeName: string;
  onStoreNameChange: (name: string) => void;
  activeItem?: BarcodeLabelItem;
  /** La etiqueta física donde sale el producto elegido. */
  activeSheet?: LabelSheet;
  onMoreSizes: () => void;
}

/** Medidas que se ofrecen a un clic; las demás están en la configuración. */
const QUICK_SIZE_IDS = ['50x25', '50x30', '40x30', '60x40'];

/** Tamaño y contenido de la etiqueta, y la vista de cómo saldrá. */
export const BarcodePreviewPanel: React.FC<BarcodePreviewPanelProps> = ({ printer, storeName, onStoreNameChange, activeItem, activeSheet, onMoreSizes }) => {
  const { config, spec, update } = printer;
  const quick = LABEL_PRESETS.filter((preset) => QUICK_SIZE_IDS.includes(preset.id));
  const isQuick = quick.some((preset) => preset.widthMm === config.widthMm && preset.heightMm === config.heightMm);
  const quality = activeItem ? labelBarcodeQuality(activeItem.sku, spec) : 'good';

  return (
    <div className="flex min-h-full flex-col gap-3.5">
      <div className="shrink-0 space-y-3 rounded-xl border border-border/80 bg-card p-3.5">
        <div>
          <p className="mb-1.5 text-xs font-semibold text-foreground">Tamaño de la etiqueta</p>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tamaño de la etiqueta">
            {quick.map((preset) => {
              const selected = preset.widthMm === config.widthMm && preset.heightMm === config.heightMm;
              return (
                <button key={preset.id} type="button" aria-pressed={selected} onClick={() => update({ widthMm: preset.widthMm, heightMm: preset.heightMm, gapMm: preset.gapMm })} className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${selected ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground hover:border-primary/40'}`}>
                  {preset.name}
                </button>
              );
            })}
            <button type="button" onClick={onMoreSizes} className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${isQuick ? 'border-dashed border-border text-muted-foreground hover:text-foreground' : 'border-primary bg-primary/10 text-primary'}`}>
              {isQuick ? 'Otra medida…' : `${config.widthMm} × ${config.heightMm} mm · cambiar`}
            </button>
          </div>
        </div>

        <LabelContentPicker printer={printer} storeName={storeName} onStoreNameChange={onStoreNameChange} />
      </div>

      <div className="flex min-h-[220px] flex-1 shrink-0 flex-col items-center justify-center rounded-xl border border-border/80 bg-muted/20 p-4">
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <Eye className="h-4 w-4 text-primary" />
          <span>Así saldrá ({config.widthMm} × {config.heightMm} mm)</span>
        </div>
        {activeSheet ? <BarcodeLabel sheet={activeSheet} storeName={storeName} spec={spec} style={config} /> : <p className="text-xs italic text-muted-foreground">Elige un producto de la lista para ver su etiqueta.</p>}
        {quality !== 'good' && (
          <p role="alert" className="mt-3 flex max-w-xs items-start gap-1.5 text-xs font-medium text-amber-600">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {quality === 'too-long'
              ? `El SKU ${activeItem?.sku} es demasiado largo para esta etiqueta: el código saldrá comprimido y puede que el escáner no lo lea.`
              : `El SKU ${activeItem?.sku} es largo para esta etiqueta: las barras salen muy finas y al escáner le puede costar.`}{' '}
            Usa un SKU más corto o una etiqueta más ancha.
          </p>
        )}
      </div>
    </div>
  );
};
