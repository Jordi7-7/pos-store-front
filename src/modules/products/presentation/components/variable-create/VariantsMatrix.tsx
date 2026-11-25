import React, { useRef } from 'react';
import { AlertTriangle, Copy, ImageIcon, RotateCcw, Tag, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import type { BulkValues, PasteColumn, RowField, RowIssue, WizardVariantRow } from '../../../domain/rules/variable-wizard';
import { NumberCell } from './NumberCell';

interface VariantsMatrixProps {
  rows: WizardVariantRow[];
  /** Problemas por id de fila (los que impiden guardar y los avisos). */
  issues: Record<string, RowIssue[]>;
  /** SKU que el servidor dijo que ya existen: se marcan en la fila. */
  takenSkus: ReadonlySet<string>;
  /** Combinaciones que se quitaron a mano: hay opciones marcadas que ya no generan fila. */
  removedCount: number;
  bulk: BulkValues;
  onBulkChange: (field: keyof BulkValues, value: string) => void;
  onApplyBulk: () => void;
  onUpdateField: (id: string, field: keyof WizardVariantRow, value: WizardVariantRow[keyof WizardVariantRow]) => void;
  onRemoveRow: (id: string) => void;
  onRestoreRemoved: () => void;
  onOpenVariantGallery: (variantId: string) => void;
  onPaste: (rowIndex: number, column: PasteColumn, text: string) => void;
}

const cellTone = (issues: RowIssue[] | undefined, field: RowField, taken = false): string => {
  const own = (issues ?? []).filter((issue) => issue.field === field);
  if (taken || own.some((issue) => issue.level === 'error')) return 'border-destructive ring-1 ring-destructive/40';
  if (own.length > 0) return 'border-amber-500 ring-1 ring-amber-500/30';
  return '';
};
const cellHint = (issues: RowIssue[] | undefined, field: RowField, taken = false): string | undefined =>
  taken ? 'Este SKU ya existe en la tienda.' : (issues ?? []).find((issue) => issue.field === field)?.message;

/** Tabla de variantes: una fila por combinación, editable como una hoja de cálculo (Enter baja, se puede pegar desde Excel). */
export const VariantsMatrix: React.FC<VariantsMatrixProps> = ({ rows, issues, takenSkus, removedCount, bulk, onBulkChange, onApplyBulk, onUpdateField, onRemoveRow, onRestoreRemoved, onOpenVariantGallery, onPaste }) => {
  const tableRef = useRef<HTMLTableElement>(null);

  // Enter pasa a la misma columna de la fila de abajo (Mayús+Enter, a la de arriba), como en una hoja de cálculo
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTableElement>) => {
    const target = event.target as HTMLElement;
    const row = Number(target.dataset.row);
    const column = target.dataset.col;
    if (event.key !== 'Enter' || !column || Number.isNaN(row)) return;
    event.preventDefault();
    const next = tableRef.current?.querySelector<HTMLInputElement>(`[data-row="${row + (event.shiftKey ? -1 : 1)}"][data-col="${column}"]`);
    next?.focus();
    next?.select();
  };

  const pasteHandler = (rowIndex: number, column: PasteColumn) => (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text');
    if (!/[\t\n]/.test(text.trim())) return; // una sola celda: pegado normal
    event.preventDefault();
    onPaste(rowIndex, column, text);
  };

  const errorCount = Object.values(issues).filter((list) => list.some((issue) => issue.level === 'error')).length;
  const warningCount = Object.values(issues).filter((list) => list.every((issue) => issue.level === 'warning')).length;

  return (
    <div className="space-y-4">
      <Card className="gap-0 border-border bg-card shadow-xs">
        <CardHeader className="border-b border-border/50 bg-muted/15 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-secondary">
            <Copy className="h-4 w-4 text-primary" />
            Llenar todas las variantes
          </CardTitle>
          <CardDescription className="text-xs">Escribe un valor y se copia a todas las filas; lo que dejes vacío no se toca.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ['purchasePrice', 'Precio de compra'],
                ['salePrice', 'Precio de venta'],
                ['wholesalePrice', 'Precio de mayoreo'],
                ['stock', 'Stock inicial'],
              ] as const
            ).map(([field, label]) => (
              <div key={field} className="space-y-1">
                <FieldLabel htmlFor={`bulk-${field}`} className="text-xs font-bold text-neutral">
                  {label}
                </FieldLabel>
                <Input id={`bulk-${field}`} type="number" step={field === 'stock' ? '1' : '0.01'} min="0" placeholder="—" value={bulk[field]} onChange={(event) => onBulkChange(field, event.target.value)} className="h-9 bg-background text-xs" />
              </div>
            ))}
          </div>
          <Button type="button" size="sm" onClick={onApplyBulk} disabled={rows.length === 0} className="h-9 cursor-pointer gap-1.5 text-xs font-bold">
            <Copy className="h-3.5 w-3.5" />
            Aplicar a las {rows.length}
          </Button>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden border-border shadow-xs">
        <CardHeader className="border-b border-border/60 bg-muted/15 pb-3">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-secondary sm:text-base">Variantes</CardTitle>
                <Badge variant="outline" className="bg-background font-mono text-xs font-bold">
                  {rows.length}
                </Badge>
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {errorCount} por corregir
                  </Badge>
                )}
                {errorCount === 0 && warningCount > 0 && (
                  <Badge variant="outline" className="border-amber-500/50 text-xs text-amber-700 dark:text-amber-300">
                    {warningCount} con aviso
                  </Badge>
                )}
              </div>
              <CardDescription className="mt-0.5 text-xs">
                Edita como en una hoja de cálculo: Enter baja a la fila siguiente y puedes pegar celdas copiadas desde Excel.
              </CardDescription>
            </div>
            {removedCount > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={onRestoreRemoved} className="cursor-pointer gap-1 self-start text-xs sm:self-center">
                <RotateCcw className="h-3.5 w-3.5" />
                Restaurar {removedCount} {removedCount === 1 ? 'combinación quitada' : 'combinaciones quitadas'}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="px-6 py-14 text-center text-xs text-neutral">
              {removedCount > 0 ? 'Quitaste todas las combinaciones.' : 'Marca al menos una opción arriba y las variantes aparecen aquí.'}
            </div>
          ) : (
            <div className="max-h-[520px] overflow-auto">
              <table ref={tableRef} onKeyDown={handleKeyDown} className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-muted/90 font-semibold text-neutral backdrop-blur-xs">
                    <th className="w-12 px-2 py-2.5 text-center">Foto</th>
                    <th className="min-w-[150px] px-3 py-2.5">Variante</th>
                    <th className="min-w-[150px] px-2 py-2.5">SKU <span className="text-destructive">*</span></th>
                    <th className="min-w-[120px] px-2 py-2.5">Código de barras</th>
                    <th className="w-24 px-2 py-2.5">P. compra</th>
                    <th className="w-24 px-2 py-2.5 text-primary">P. venta <span className="text-destructive">*</span></th>
                    <th className="w-24 px-2 py-2.5">P. mayoreo</th>
                    <th className="w-20 px-2 py-2.5">Stock</th>
                    <th className="w-10 px-2 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rows.map((row, index) => {
                    const rowIssues = issues[row.id];
                    const label = row.combination.map((item) => item.valueName).join(' / ') || row.sku;
                    const skuTaken = takenSkus.has(row.sku.trim().toUpperCase());
                    const photo = row.images?.[0];
                    return (
                      <tr key={row.id} className="transition-colors hover:bg-muted/20">
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => onOpenVariantGallery(row.id)}
                            aria-label={photo ? `Cambiar la foto de ${label}` : `Asignar una foto a ${label}`}
                            className={`flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-lg border transition-all ${photo ? 'border-primary/50 bg-background hover:ring-2 hover:ring-primary/40' : 'border-dashed border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary'}`}
                          >
                            {photo ? <img src={photo.url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 opacity-70" />}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1.5">
                            {row.combination.map((item) => (
                              <Badge key={item.valueId} variant="secondary" className="border border-border/80 bg-background px-2 py-0.5 text-xs font-medium shadow-2xs">
                                <Tag className="mr-1 h-2.5 w-2.5 text-primary opacity-70" />
                                <span className="mr-1 text-neutral">{item.attributeName}:</span>
                                <strong className="font-semibold text-foreground">{item.valueName}</strong>
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            value={row.sku}
                            data-row={index}
                            data-col="sku"
                            aria-label={`SKU de ${label}`}
                            title={cellHint(rowIssues, 'sku', skuTaken)}
                            aria-invalid={skuTaken || !!cellTone(rowIssues, 'sku') || undefined}
                            onChange={(event) => {
                              onUpdateField(row.id, 'sku', event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''));
                              onUpdateField(row.id, 'skuEdited', true);
                            }}
                            onPaste={pasteHandler(index, 'sku')}
                            className={`h-9 w-full min-w-[130px] bg-background text-xs font-medium ${cellTone(rowIssues, 'sku', skuTaken)}`}
                          />
                          {(skuTaken || cellHint(rowIssues, 'sku')) && <p className="mt-0.5 text-xs text-destructive">{cellHint(rowIssues, 'sku', skuTaken)}</p>}
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            value={row.barcode}
                            data-row={index}
                            data-col="barcode"
                            aria-label={`Código de barras de ${label}`}
                            placeholder="Opcional"
                            onChange={(event) => onUpdateField(row.id, 'barcode', event.target.value)}
                            onPaste={pasteHandler(index, 'barcode')}
                            className="h-9 w-full min-w-[100px] bg-background text-xs"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <NumberCell
                            value={row.purchasePrice}
                            data-row={index}
                            data-col="purchasePrice"
                            aria-label={`Precio de compra de ${label}`}
                            title={cellHint(rowIssues, 'purchasePrice')}
                            onValueChange={(value) => onUpdateField(row.id, 'purchasePrice', value ?? 0)}
                            onPaste={pasteHandler(index, 'purchasePrice')}
                            className={`h-9 w-full min-w-[70px] bg-background text-xs ${cellTone(rowIssues, 'purchasePrice')}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <NumberCell
                            value={row.salePrice}
                            data-row={index}
                            data-col="salePrice"
                            aria-label={`Precio de venta de ${label}`}
                            title={cellHint(rowIssues, 'salePrice')}
                            onValueChange={(value) => onUpdateField(row.id, 'salePrice', value ?? 0)}
                            onPaste={pasteHandler(index, 'salePrice')}
                            className={`h-9 w-full min-w-[70px] bg-background text-xs font-semibold ${cellTone(rowIssues, 'salePrice')}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <NumberCell
                            value={row.wholesalePrice}
                            data-row={index}
                            data-col="wholesalePrice"
                            aria-label={`Precio de mayoreo de ${label}`}
                            placeholder="—"
                            onValueChange={(value) => onUpdateField(row.id, 'wholesalePrice', value)}
                            onPaste={pasteHandler(index, 'wholesalePrice')}
                            className={`h-9 w-full min-w-[70px] bg-background text-xs ${cellTone(rowIssues, 'wholesalePrice')}`}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <NumberCell
                            value={row.initialStock}
                            data-row={index}
                            data-col="initialStock"
                            aria-label={`Stock inicial de ${label}`}
                            onValueChange={(value) => onUpdateField(row.id, 'initialStock', value ?? 0)}
                            onPaste={pasteHandler(index, 'initialStock')}
                            className={`h-9 w-full min-w-[60px] bg-background text-xs ${cellTone(rowIssues, 'initialStock')}`}
                          />
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => onRemoveRow(row.id)}
                            aria-label={`Quitar la variante ${label}`}
                            title="Quitar esta combinación (no la vendes)"
                            className="cursor-pointer rounded-lg p-1.5 text-neutral transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {warningCount > 0 && errorCount === 0 && (
          <div className="flex items-center gap-2 border-t border-border/60 bg-amber-500/5 px-4 py-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Hay avisos (precio bajo el costo o stock con costo 0). Puedes guardar igual; pasa el cursor por la celda marcada para ver el detalle.
          </div>
        )}
      </Card>
    </div>
  );
};
