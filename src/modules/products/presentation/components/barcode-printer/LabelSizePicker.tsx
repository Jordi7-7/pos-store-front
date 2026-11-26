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

interface MillimetersFieldProps {
  label: string;
  /** Texto accesible completo del campo. */
  ariaLabel: string;
  value: number;
  min: number;
  max: number;
  onValue: (value: number) => void;
}

/** Campo de milímetros: solo pasa al padre valores dentro del rango, con un decimal como máximo. */
const MillimetersField: React.FC<MillimetersFieldProps> = ({ label, ariaLabel, value, min, max, onValue }) => (
  <label className="space-y-1 text-xs text-muted-foreground">
    {label}
    <Input
      type="number"
      min={min}
      max={max}
      step="0.5"
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => {
        const typed = Number(event.target.value);
        if (event.target.value !== '' && Number.isFinite(typed) && typed >= min && typed <= max) onValue(Math.round(typed * 10) / 10);
      }}
    />
  </label>
);

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
        <MillimetersField label="Ancho" ariaLabel="Ancho de la etiqueta en milímetros" value={config.widthMm} min={5} max={300} onValue={(widthMm) => onChange({ widthMm })} />
        <MillimetersField label="Alto" ariaLabel="Alto de la etiqueta en milímetros" value={config.heightMm} min={5} max={300} onValue={(heightMm) => onChange({ heightMm })} />
        <MillimetersField label="Separación" ariaLabel="Separación entre etiquetas en milímetros" value={config.gapMm} min={0} max={10} onValue={(gapMm) => onChange({ gapMm })} />
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
