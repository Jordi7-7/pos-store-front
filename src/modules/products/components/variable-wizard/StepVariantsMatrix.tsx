import React from 'react';
import { 
  Sparkles, 
  Copy, 
  Trash2, 
  AlertCircle, 
  Loader2,
  Tag,
  DollarSign,
  PackageCheck,
  RotateCcw,
  ImageIcon,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';

export interface VariantRowData {
  id: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  wholesalePrice: number | null;
  initialStock: number;
  combination: { attributeId: string; attributeName: string; valueId: string; valueName: string }[];
  images?: { id: string; url: string; description?: string }[];
  imageIds?: string[];
}

interface StepVariantsMatrixProps {
  variants: VariantRowData[];
  baseSkuPrefix?: string;
  onUpdateVariantField: (id: string, field: keyof VariantRowData, value: any) => void;
  onRemoveVariantRow: (id: string) => void;
  onClearVariants: () => void;
  onOpenVariantGallery?: (variantId: string) => void;
  // Bulk inputs
  bulkSkuPrefix: string;
  setBulkSkuPrefix: (val: string) => void;
  bulkPurchasePrice: string;
  setBulkPurchasePrice: (val: string) => void;
  bulkSalePrice: string;
  setBulkSalePrice: (val: string) => void;
  bulkWholesalePrice: string;
  setBulkWholesalePrice: (val: string) => void;
  bulkStock: string;
  setBulkStock: (val: string) => void;
  onApplyBulk: () => void;
  // Submission
  isSubmitting: boolean;
  isAllBranches: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export const StepVariantsMatrix: React.FC<StepVariantsMatrixProps> = ({
  variants,
  baseSkuPrefix = '',
  onUpdateVariantField,
  onRemoveVariantRow,
  onClearVariants,
  onOpenVariantGallery,
  bulkSkuPrefix,
  setBulkSkuPrefix,
  bulkPurchasePrice,
  setBulkPurchasePrice,
  bulkSalePrice,
  setBulkSalePrice,
  bulkWholesalePrice,
  setBulkWholesalePrice,
  bulkStock,
  setBulkStock,
  onApplyBulk,
  isSubmitting,
  isAllBranches,
  onBack,
  onSubmit,
}) => {
  return (
    <div className="space-y-5">
      {/* Bulk Pricing Quick Bar */}
      <Card className="border-border shadow-xs bg-card overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/50 bg-muted/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm flex items-center gap-2 text-secondary font-bold">
                <Sparkles className="w-4 h-4 text-primary" />
                Asignación Masiva Rápida (Opcional)
              </CardTitle>
              <CardDescription className="text-xs text-neutral mt-0.5">
                Ingresa valores aquí para replicarlos en las <strong className="text-foreground">{variants.length} variantes</strong> con un solo clic.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onApplyBulk}
              className="text-xs h-8 cursor-pointer font-bold self-start sm:self-center shadow-xs gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              Aplicar a Todas
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="space-y-1">
              <FieldLabel className="text-[10px] text-neutral font-bold uppercase tracking-wider">
                Prefijo SKU
              </FieldLabel>
              <Input
                placeholder="Ej. HM123"
                value={bulkSkuPrefix}
                onChange={(e) => setBulkSkuPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                className="text-xs h-9 bg-background"
              />
            </div>
            <div className="space-y-1">
              <FieldLabel className="text-[10px] text-neutral font-bold uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-neutral" />
                P. Compra
              </FieldLabel>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={bulkPurchasePrice}
                onChange={(e) => setBulkPurchasePrice(e.target.value)}
                className="text-xs h-9 bg-background"
              />
            </div>
            <div className="space-y-1">
              <FieldLabel className="text-[10px] text-neutral font-bold uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-neutral" />
                P. Venta
              </FieldLabel>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={bulkSalePrice}
                onChange={(e) => setBulkSalePrice(e.target.value)}
                className="text-xs h-9 bg-background font-semibold"
              />
            </div>
            <div className="space-y-1">
              <FieldLabel className="text-[10px] text-neutral font-bold uppercase tracking-wider">
                P. Mayoreo (Opc.)
              </FieldLabel>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={bulkWholesalePrice}
                onChange={(e) => setBulkWholesalePrice(e.target.value)}
                className="text-xs h-9 bg-background"
              />
            </div>
            <div className="space-y-1">
              <FieldLabel className="text-[10px] text-neutral font-bold uppercase tracking-wider flex items-center gap-1">
                <PackageCheck className="w-3 h-3 text-neutral" />
                Stock Inicial
              </FieldLabel>
              <Input
                type="number"
                step="1"
                placeholder="0"
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value)}
                className="text-xs h-9 bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variants Matrix Table Card */}
      <Card className="border-border shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60 bg-muted/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm sm:text-base font-bold text-secondary">
                  3. Matriz de Variantes Generadas
                </CardTitle>
                <Badge variant="outline" className="text-[11px] font-mono font-bold bg-background">
                  {variants.length} variantes
                </Badge>
              </div>
              <CardDescription className="text-xs text-neutral mt-0.5">
                Revisa y ajusta individualmente el SKU, código de barras, precios y existencias de cada combinación.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearVariants}
              className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer gap-1 self-start sm:self-center"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Regenerar atributos</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border bg-muted/90 backdrop-blur-xs text-neutral font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-2 font-bold text-center w-12">Foto</th>
                  <th className="py-2.5 px-3 font-bold min-w-[140px]">Variante / Atributos</th>
                  <th className="py-2.5 px-2.5 font-bold min-w-[130px]">SKU <span className="text-destructive">*</span></th>
                  <th className="py-2.5 px-2.5 font-bold min-w-[110px]">Código Barras</th>
                  <th className="py-2.5 px-2 font-bold w-24">P. Compra</th>
                  <th className="py-2.5 px-2 font-bold text-primary w-24">P. Venta <span className="text-destructive">*</span></th>
                  <th className="py-2.5 px-2 font-bold w-24">P. Mayoreo</th>
                  <th className="py-2.5 px-2 font-bold w-20">Stock</th>
                  <th className="py-2.5 px-2 text-center font-bold w-12">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {variants.map((v) => {
                  const firstImg = v.images && v.images.length > 0 ? v.images[0] : null;

                  return (
                  <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                    {/* Foto */}
                    <td className="py-2 px-3 text-center">
                      {onOpenVariantGallery && (
                        <button
                          type="button"
                          onClick={() => onOpenVariantGallery(v.id)}
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
                      )}
                    </td>

                    {/* Atributos */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {v.combination.map((c, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-[10px] font-medium bg-background border border-border/80 px-2 py-0.5 shadow-2xs"
                          >
                            <Tag className="w-2.5 h-2.5 text-primary mr-1 opacity-70" />
                            <span className="text-neutral mr-1">{c.attributeName}:</span>
                            <strong className="text-foreground font-semibold">{c.valueName}</strong>
                          </Badge>
                        ))}
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-2.5 px-2.5">
                      {(() => {
                        const effectivePrefix = (baseSkuPrefix && baseSkuPrefix.trim()) || (bulkSkuPrefix && bulkSkuPrefix.trim()) || '';
                        const currentSku = v.sku || '';

                        // If current SKU starts with prefix + '-', split suffix
                        const prefixWithDash = effectivePrefix ? `${effectivePrefix}-` : '';
                        const hasPrefix = prefixWithDash && currentSku.startsWith(prefixWithDash);
                        const suffix = hasPrefix ? currentSku.slice(prefixWithDash.length) : currentSku;

                        if (effectivePrefix) {
                          return (
                            <div className="flex items-center gap-0 border border-input rounded-lg overflow-hidden bg-background w-full min-w-[120px] max-w-[160px] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 transition-colors">
                              <span className="bg-muted px-2 py-1.5 text-xs font-semibold text-secondary select-none shrink-0 border-r border-border">
                                {effectivePrefix}-
                              </span>
                              <input
                                type="text"
                                value={suffix}
                                onChange={(e) => {
                                  const cleanSuffix = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                                  onUpdateVariantField(v.id, 'sku', `${effectivePrefix}-${cleanSuffix}`);
                                }}
                                className="w-full text-xs font-medium px-2 py-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                                placeholder="1"
                              />
                            </div>
                          );
                        }

                        return (
                          <Input
                            value={v.sku}
                            onChange={(e) => onUpdateVariantField(v.id, 'sku', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                            className="text-xs h-9 w-full min-w-[110px] max-w-[140px] bg-background font-medium"
                            placeholder="SKU"
                          />
                        );
                      })()}
                    </td>

                    {/* Barcode */}
                    <td className="py-2.5 px-2.5">
                      <Input
                        value={v.barcode}
                        onChange={(e) => onUpdateVariantField(v.id, 'barcode', e.target.value)}
                        className="text-xs h-9 w-full min-w-[100px] max-w-[140px] bg-background"
                        placeholder="Opcional"
                      />
                    </td>

                    {/* Purchase Price */}
                    <td className="py-2.5 px-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={v.purchasePrice}
                        onChange={(e) => onUpdateVariantField(v.id, 'purchasePrice', Number(e.target.value))}
                        className="text-xs h-9 w-full min-w-[70px] bg-background"
                      />
                    </td>

                    {/* Sale Price */}
                    <td className="py-2.5 px-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={v.salePrice}
                        onChange={(e) => onUpdateVariantField(v.id, 'salePrice', Number(e.target.value))}
                        className="text-xs font-semibold h-9 w-full min-w-[70px] bg-background"
                      />
                    </td>

                    {/* Wholesale Price */}
                    <td className="py-2.5 px-2">
                      <Input
                        type="number"
                        step="0.01"
                        value={v.wholesalePrice ?? ''}
                        onChange={(e) =>
                          onUpdateVariantField(
                            v.id,
                            'wholesalePrice',
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        placeholder="N/A"
                        className="text-xs h-9 w-full min-w-[70px] bg-background"
                      />
                    </td>

                    {/* Initial Stock */}
                    <td className="py-2.5 px-2">
                      <Input
                        type="number"
                        step="1"
                        value={v.initialStock}
                        onChange={(e) => onUpdateVariantField(v.id, 'initialStock', Number(e.target.value))}
                        className="text-xs h-9 w-full min-w-[60px] bg-background"
                      />
                    </td>

                    {/* Delete Row */}
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveVariantRow(v.id)}
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
          </div>
        </CardContent>
      </Card>

      {/* Warning banner when in Global / All branches view */}
      {isAllBranches && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Estás en <strong>Todas las Sucursales</strong>. Selecciona una sucursal específica en la barra superior para asignar el stock inicial de las variantes y poder guardar.
            </span>
          </div>
        </div>
      )}

      {/* Navigation and Final Submit */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="h-11 px-4 text-xs font-semibold cursor-pointer"
        >
          &larr; Volver a Atributos
        </Button>

        <Button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || isAllBranches || variants.length === 0}
          className="h-11 px-6 text-xs font-bold shadow-sm shadow-primary/20 cursor-pointer"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {isAllBranches
            ? 'Selecciona una sucursal específica'
            : variants.length === 0
            ? 'Sin variantes para guardar'
            : `Guardar Producto Compuesto (${variants.length} variantes)`}
        </Button>
      </div>
    </div>
  );
};

