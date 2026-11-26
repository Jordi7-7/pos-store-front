import React from 'react';
import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LABEL_PRESETS } from '@/modules/printing/domain/rules/label-presets';
import type { LabelPrinterConfig } from '@/modules/printing/infrastructure/printers/label-printer.service';

interface LabelSizePickerProps {
  config: LabelPrinterConfig;
  onChange: (patch: Partial<LabelPrinterConfig>) => void;
}

const sameSize = (config: LabelPrinterConfig, widthMm: number, heightMm: number) => config.widthMm === widthMm && config.heightMm === heightMm;

/** Número de milímetros escrito a mano: solo valores razonables (5 a 300 mm). */
const mm = (text: string): number | null => {
  const value = Number(text);
  return Number.isFinite(value) && value >= 5 && value <= 300 ? Math.round(value * 10) / 10 : null;
};

/** Tamaños de etiqueta comunes, medida propia y girar (ancho ↔ alto) para rollos que se alimentan de lado. */
export const LabelSizePicker: React.FC<LabelSizePickerProps> = ({ config, onChange }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Tamaños de etiqueta comunes">
      {LABEL_PRESETS.map((preset) => {
        const selected = sameSize(config, preset.widthMm, preset.heightMm);
        return (
          <button
            key={preset.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange({ widthMm: preset.widthMm, heightMm: preset.heightMm, gapMm: preset.gapMm })}
            className={`cursor-pointer rounded-xl border px-3 py-2 text-left transition-colors ${selected ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-border bg-background hover:border-primary/40'}`}
          >
            <span className="block text-sm font-semibold text-foreground">{preset.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{preset.description}</span>
          </button>
        );
      })}
    </div>

    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <p className="mb-2 text-xs font-semibold text-foreground">¿Otra medida? Escríbela (en milímetros)</p>
      <div className="grid grid-cols-3 gap-2">
        <label className="space-y-1 text-xs text-muted-foreground">
          Ancho
          <Input type="number" min={5} max={300} step="0.5" value={config.widthMm} onChange={(e) => { const value = mm(e.target.value); if (value) onChange({ widthMm: value }); }} aria-label="Ancho de la etiqueta en milímetros" />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          Alto
          <Input type="number" min={5} max={300} step="0.5" value={config.heightMm} onChange={(e) => { const value = mm(e.target.value); if (value) onChange({ heightMm: value }); }} aria-label="Alto de la etiqueta en milímetros" />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          Separación
          <Input type="number" min={0} max={10} step="0.5" value={config.gapMm} onChange={(e) => { const value = Number(e.target.value); if (Number.isFinite(value) && value >= 0 && value <= 10) onChange({ gapMm: value }); }} aria-label="Separación entre etiquetas en milímetros" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">El <strong>ancho</strong> es el lado que cruza la impresora. Si tu rollo sale de lado, gira la medida.</p>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange({ widthMm: config.heightMm, heightMm: config.widthMm })}>
          <RotateCw />
          Girar ({config.heightMm} × {config.widthMm})
        </Button>
      </div>
    </div>
  </div>
);
