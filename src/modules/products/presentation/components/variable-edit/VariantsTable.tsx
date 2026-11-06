import React from 'react';
import { ImageIcon, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { normalizeSkuInput, splitVariantSku, type EditableVariantRow } from '../../../domain/rules/variant-rows';

type ChangeField = (id: string, field: keyof EditableVariantRow, value: string | number | null) => void;

interface VariantsTableProps {
  rows: EditableVariantRow[];
  /** SKU base escrito ahora en el formulario del padre y el que tiene guardado el producto (los SKU de variante llevan ese prefijo). */
  currentBaseSku: string;
  savedBaseSku: string;
  isDeleting: boolean;
  onChangeField: ChangeField;
  onDelete: (id: string, sku: string) => void;
  onPickImage: (rowId: string) => void;
  onAddVariant: () => void;
}

/** SKU de la variante: el prefijo del SKU base queda fijo y solo se edita el final. */
const SkuField: React.FC<{ row: EditableVariantRow; currentBaseSku: string; savedBaseSku: string; onChange: ChangeField }> = ({ row, currentBaseSku, savedBaseSku, onChange }) => {
  const { prefix, suffix } = splitVariantSku(row.sku || '', currentBaseSku, savedBaseSku);
  if (!prefix) {
    return <Input value={row.sku} onChange={(e) => onChange(row.id, 'sku', normalizeSkuInput(e.target.value))} aria-label="SKU" className="w-full font-mono text-xs font-semibold md:w-36" />;
  }
  return (
    <div className="flex w-full items-center overflow-hidden rounded-lg border border-input bg-card focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 md:w-40">
      <span className="shrink-0 border-r border-border-card bg-muted/70 px-2 py-2 font-mono text-xs font-semibold text-foreground">{prefix}-</span>
      <input
        type="text"
        value={suffix}
        onChange={(e) => onChange(row.id, 'sku', `${prefix}-${normalizeSkuInput(e.target.value)}`)}
        aria-label="SKU"
        className="w-full min-w-0 bg-transparent px-2 py-1.5 font-mono text-xs font-semibold text-foreground outline-none placeholder:text-muted-foreground"
        placeholder="1"
      />
    </div>
  );
};

const PhotoButton: React.FC<{ row: EditableVariantRow; onPick: (id: string) => void }> = ({ row, onPick }) => {
  const first = row.images?.[0] ?? null;
  return (
    <button
      type="button"
      onClick={() => onPick(row.id)}
      title={first ? 'Cambiar foto de la variante' : 'Asignar foto a esta variante'}
      className={`flex size-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border transition-colors ${
        first ? 'border-primary/50 bg-background hover:ring-2 hover:ring-primary/40' : 'border-dashed border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:text-primary'
      }`}
    >
      {first ? <img src={first.url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4" />}
    </button>
  );
};

const Combination: React.FC<{ row: EditableVariantRow }> = ({ row }) => (
  <span className="flex flex-wrap items-center gap-1.5">
    <Badge variant="outline" className="h-6 bg-card px-2 font-medium text-foreground">
      {row.combinationText}
    </Badge>
    {row.hasChanged && <span className="text-xs font-medium text-primary">Modificado</span>}
  </span>
);

const NumberField: React.FC<{ label: string; row: EditableVariantRow; field: 'purchasePrice' | 'salePrice' | 'wholesalePrice'; onChange: ChangeField; placeholder?: string; bold?: boolean }> = ({ label, row, field, onChange, placeholder, bold }) => (
  <Input
    type="number"
    step="0.01"
    aria-label={label}
    placeholder={placeholder}
    value={row[field] ?? ''}
    onChange={(e) => onChange(row.id, field, field === 'wholesalePrice' && e.target.value === '' ? null : e.target.value)}
    className={`w-full font-mono text-xs md:w-20 ${bold ? 'font-bold' : ''}`}
  />
);

/** Lista de variantes activas, editable (SKU, código de barras, precios, foto) con alta y baja: tabla en pantallas anchas y tarjetas en móvil. */
export const VariantsTable: React.FC<VariantsTableProps> = ({ rows, currentBaseSku, savedBaseSku, isDeleting, onChangeField, onDelete, onPickImage, onAddVariant }) => {
  // Se dibuja una sola de las dos vistas (no una oculta por CSS): así no hay controles duplicados en la página.
  const isMobile = useIsMobile();
  return (
  <Card className="overflow-hidden">
    <CardHeader className="border-b border-border-card bg-muted/30 pb-3">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-semibold text-secondary">Variantes activas</CardTitle>
            <Badge variant="outline" className="bg-background font-mono">
              {rows.length}
            </Badge>
          </div>
          <CardDescription className="mt-0.5 text-xs">Ajusta el SKU, el código de barras y los precios de cada variante.</CardDescription>
        </div>
        <Button type="button" size="sm" onClick={onAddVariant} className="self-start sm:self-center">
          <Plus />
          Nueva variante
        </Button>
      </div>
    </CardHeader>

    <CardContent className="p-0">
      {/* Pantallas anchas: tabla */}
      {!isMobile && (
      <div className="max-h-[460px] overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-muted/90 backdrop-blur-xs">
            <tr className="border-b border-border-card text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="w-14 px-2 py-2.5 text-center">Foto</th>
              <th className="px-2 py-2.5">Combinación</th>
              <th className="px-2 py-2.5">SKU</th>
              <th className="px-2 py-2.5">Código barras</th>
              <th className="px-2 py-2.5">Compra</th>
              <th className="px-2 py-2.5 text-foreground">Venta</th>
              <th className="px-2 py-2.5">Mayoreo</th>
              <th className="px-2 py-2.5 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-card">
            {rows.map((row) => (
              <tr key={row.id} className={`transition-colors hover:bg-muted/30 ${row.hasChanged ? 'bg-primary/5' : ''}`}>
                <td className="px-2 py-2 text-center"><PhotoButton row={row} onPick={onPickImage} /></td>
                <td className="px-2 py-2"><Combination row={row} /></td>
                <td className="px-2 py-2"><SkuField row={row} currentBaseSku={currentBaseSku} savedBaseSku={savedBaseSku} onChange={onChangeField} /></td>
                <td className="px-2 py-2"><Input value={row.barcode} onChange={(e) => onChangeField(row.id, 'barcode', e.target.value)} placeholder="Opcional" aria-label="Código de barras" className="w-28 font-mono text-xs" /></td>
                <td className="px-2 py-2"><NumberField label="Precio de compra" row={row} field="purchasePrice" onChange={onChangeField} /></td>
                <td className="px-2 py-2"><NumberField label="Precio de venta" row={row} field="salePrice" onChange={onChangeField} bold /></td>
                <td className="px-2 py-2"><NumberField label="Precio de mayoreo" row={row} field="wholesalePrice" onChange={onChangeField} placeholder="N/A" /></td>
                <td className="px-2 py-2 text-center">
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => onDelete(row.id, row.sku)} disabled={isDeleting} title="Eliminar esta variante" aria-label="Eliminar esta variante" className="text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500">
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Móvil: una tarjeta por variante */}
      {isMobile && (
      <ul className="divide-y divide-border-card">
        {rows.map((row) => (
          <li key={row.id} className={`space-y-3 p-4 ${row.hasChanged ? 'bg-primary/5' : ''}`}>
            <div className="flex items-center gap-3">
              <PhotoButton row={row} onPick={onPickImage} />
              <div className="min-w-0 flex-1"><Combination row={row} /></div>
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => onDelete(row.id, row.sku)} disabled={isDeleting} title="Eliminar esta variante" aria-label="Eliminar esta variante" className="text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500">
                <Trash2 />
              </Button>
            </div>
            <SkuField row={row} currentBaseSku={currentBaseSku} savedBaseSku={savedBaseSku} onChange={onChangeField} />
            <Input value={row.barcode} onChange={(e) => onChangeField(row.id, 'barcode', e.target.value)} placeholder="Código de barras (opcional)" aria-label="Código de barras" className="w-full font-mono text-xs" />
            <div className="grid grid-cols-3 gap-2">
              <label className="space-y-1 text-xs text-muted-foreground">Compra<NumberField label="Precio de compra" row={row} field="purchasePrice" onChange={onChangeField} /></label>
              <label className="space-y-1 text-xs font-medium text-foreground">Venta<NumberField label="Precio de venta" row={row} field="salePrice" onChange={onChangeField} bold /></label>
              <label className="space-y-1 text-xs text-muted-foreground">Mayoreo<NumberField label="Precio de mayoreo" row={row} field="wholesalePrice" onChange={onChangeField} placeholder="N/A" /></label>
            </div>
          </li>
        ))}
      </ul>
      )}
    </CardContent>
  </Card>
  );
};
