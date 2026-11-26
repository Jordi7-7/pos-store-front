import React from 'react';
import { Store } from 'lucide-react';
import type { LabelContent } from '@/modules/printing/domain/rules/label-sheets';
import type { LabelPrinterState } from '@/modules/printing/presentation/hooks/useLabelPrinter';

const CONTENTS: Array<{ value: LabelContent; label: string }> = [
  { value: 'FULL', label: 'Etiqueta completa' },
  { value: 'BARCODE', label: 'Solo código de barras' },
];

interface LabelContentPickerProps {
  printer: LabelPrinterState;
  storeName: string;
  onStoreNameChange: (name: string) => void;
}

/** Qué se imprime en la etiqueta: todo, o solo el código de barras (opcionalmente dos para cortar). */
export const LabelContentPicker: React.FC<LabelContentPickerProps> = ({ printer, storeName, onStoreNameChange }) => {
  const { config, update } = printer;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-foreground">Qué lleva la etiqueta</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Qué lleva la etiqueta">
        {CONTENTS.map(({ value, label }) => (
          <button key={value} type="button" aria-pressed={config.content === value} onClick={() => update({ content: value })} className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${config.content === value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground hover:border-primary/40'}`}>
            {label}
          </button>
        ))}
      </div>

      {config.content === 'BARCODE' ? (
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground">
          <input type="checkbox" checked={config.twoPerLabel} onChange={(e) => update({ twoPerLabel: e.target.checked })} className="size-4 cursor-pointer accent-primary" />
          2 códigos por etiqueta (para cortarla a la mitad)
        </label>
      ) : (
        <div className="space-y-1.5">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground">
            <input type="checkbox" checked={config.showStore} onChange={(e) => update({ showStore: e.target.checked })} className="size-4 cursor-pointer accent-primary" />
            Mostrar el nombre de la tienda arriba
          </label>
          {config.showStore && (
            <div className="relative">
              <Store className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input type="text" aria-label="Nombre de la tienda en la etiqueta" value={storeName} onChange={(e) => onStoreNameChange(e.target.value.toUpperCase())} placeholder="NOMBRE DE LA TIENDA" className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs font-semibold focus:border-primary focus:outline-none" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
