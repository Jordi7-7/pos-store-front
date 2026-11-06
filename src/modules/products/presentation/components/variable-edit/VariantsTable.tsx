import React from 'react';
import { Plus, Trash2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { EditableVariantRow } from '../../../domain/rules/variant-rows';

interface VariantsTableProps {
  rows: EditableVariantRow[];
  /** SKU base escrito ahora en el formulario del padre y el que tiene guardado el producto (los SKU de variante llevan ese prefijo). */
  currentBaseSku: string;
  savedBaseSku: string;
  isDeleting: boolean;
  onChangeField: (id: string, field: keyof EditableVariantRow, value: string | number | null) => void;
  onDelete: (id: string, sku: string) => void;
  onPickImage: (rowId: string) => void;
  onAddVariant: () => void;
}

/** Lista de variantes activas, editable fila por fila (SKU, código de barras, precios, foto) con alta y baja. */
export const VariantsTable: React.FC<VariantsTableProps> = ({ rows, currentBaseSku, savedBaseSku, isDeleting, onChangeField, onDelete, onPickImage, onAddVariant }) => {
  return (
          <Card className="border-border shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/60 bg-muted/15">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xs font-bold text-secondary uppercase tracking-wider">
                      Lista de Variantes Activas
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono font-bold bg-background">
                      {rows.length} variantes
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-neutral mt-0.5">
                    Revisa y ajusta individualmente el SKU, código de barras y precios de cada variante.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={onAddVariant}
                  className="text-xs h-8 cursor-pointer font-bold gap-1.5 self-start sm:self-center shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nueva Variante
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-muted/90 backdrop-blur-xs text-neutral font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-bold text-center w-14">Foto</th>
                    <th className="py-2.5 px-3.5 font-bold">Combinación</th>
                    <th className="py-2.5 px-3 font-bold">SKU</th>
                    <th className="py-2.5 px-3 font-bold">Código Barras</th>
                    <th className="py-2.5 px-3 font-bold">P. Compra</th>
                    <th className="py-2.5 px-3 font-bold text-primary">P. Venta</th>
                    <th className="py-2.5 px-3 font-bold">P. Mayoreo</th>
                    <th className="py-2.5 px-3 text-center font-bold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rows.map((row) => {
                    const firstImg = row.images && row.images.length > 0 ? row.images[0] : null;

                    return (
                    <tr
                      key={row.id}
                      className={`hover:bg-muted/20 transition-colors ${
                        row.hasChanged ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            onPickImage(row.id);
                          }}
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center overflow-hidden transition-all cursor-pointer group ${
                            firstImg
                              ? 'border-primary/50 bg-background hover:ring-2 hover:ring-primary/40'
                              : 'border-dashed border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary'
                          }`}
                          title={firstImg ? 'Cambiar foto de la variante' : 'Asignar foto a esta variante'}
                        >
                          {firstImg ? (
                            <img src={firstImg.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          ) : (
                            <ImageIcon className="w-4 h-4 opacity-70 group-hover:scale-110 transition-transform" />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-3.5">
                        <Badge variant="secondary" className="text-[11px] font-semibold bg-background border border-border/80 px-2 py-0.5 shadow-2xs">
                          {row.combinationText}
                        </Badge>
                        {row.hasChanged && (
                          <span className="ml-1.5 text-[10px] text-primary font-bold italic">
                            (Modificado)
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {(() => {
                          const effectivePrefix = (currentBaseSku && currentBaseSku.trim()) || (savedBaseSku && savedBaseSku.trim()) || '';
                          const currentSku = row.sku || '';
                          const prefixWithDash = effectivePrefix ? `${effectivePrefix}-` : '';
                      
                          // Determinar sufijo: si tiene el prefijo actual se quita; si tiene el prefijo anterior del producto también se quita
                          let suffix = currentSku;
                          if (prefixWithDash && currentSku.startsWith(prefixWithDash)) {
                            suffix = currentSku.slice(prefixWithDash.length);
                          } else if (savedBaseSku && currentSku.startsWith(`${savedBaseSku}-`)) {
                            suffix = currentSku.slice(`${savedBaseSku}-`.length);
                          } else if (currentSku.includes('-')) {
                            // Fallback: si tiene un guion, tomar la parte posterior al primer guion
                            suffix = currentSku.split('-').slice(1).join('-');
                          }

                          if (effectivePrefix) {
                            return (
                              <div className="flex items-center gap-0 border border-border/80 rounded-md overflow-hidden bg-background w-36 focus-within:ring-1 focus-within:ring-primary shadow-2xs">
                                <span className="bg-muted/70 px-2 py-1 text-[11px] font-mono font-bold text-primary select-none shrink-0 border-r border-border/60">
                                  {effectivePrefix}-
                                </span>
                                <input
                                  type="text"
                                  value={suffix}
                                  onChange={(e) => {
                                    const cleanSuffix = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                                    onChangeField(row.id, 'sku', `${effectivePrefix}-${cleanSuffix}`);
                                  }}
                                  className="w-full text-xs font-mono font-bold px-1.5 py-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40"
                                  placeholder="1"
                                />
                              </div>
                            );
                          }

                          return (
                            <Input
                              value={row.sku}
                              onChange={(e) => onChangeField(row.id, 'sku', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                              className="text-xs font-mono font-bold h-8 w-32 bg-background/80"
                            />
                          );
                        })()}
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          value={row.barcode}
                          onChange={(e) => onChangeField(row.id, 'barcode', e.target.value)}
                          placeholder="Opcional"
                          className="text-xs font-mono h-8 w-32 bg-background/80"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={row.purchasePrice ?? ''}
                          onChange={(e) =>
                            onChangeField(row.id, 'purchasePrice', e.target.value)
                          }
                          className="text-xs font-mono h-8 w-24 bg-background/80"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={row.salePrice ?? ''}
                          onChange={(e) =>
                            onChangeField(row.id, 'salePrice', e.target.value)
                          }
                          className="text-xs font-mono font-bold text-primary h-8 w-24 bg-background border-primary/40 focus:border-primary"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={row.wholesalePrice ?? ''}
                          placeholder="N/A"
                          onChange={(e) =>
                            onChangeField(
                              row.id,
                              'wholesalePrice',
                              e.target.value === '' ? null : e.target.value
                            )
                          }
                          className="text-xs font-mono h-8 w-24 bg-background/80"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onDelete(row.id, row.sku)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg text-neutral hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Eliminar esta variante"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </CardContent>
    </Card>
  );
};
