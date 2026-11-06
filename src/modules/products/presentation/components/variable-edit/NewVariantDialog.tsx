import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/field';
import type { AttributeEntity as Attribute } from '../../../domain/entities/catalog.entity';
import type { NewVariantInput } from '../../../application/ports/products.repository';
import type { VariantSuggestion } from '../../../domain/rules/variant-suggestion';

interface NewVariantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Valores con los que se abre el formulario (SKU siguiente, precios de la primera variante). */
  suggestion: VariantSuggestion;
  /** Solo los atributos que ya usa el producto. */
  attributes: Attribute[];
  /** Sucursal donde se carga el stock inicial; sin ella no se pide stock. */
  branchId?: string;
  isSubmitting: boolean;
  onSubmit: (input: NewVariantInput) => void | Promise<void>;
}

/** Diálogo para añadir una variante a un producto: combinación de atributos, SKU, precios y stock inicial. */
export const NewVariantDialog: React.FC<NewVariantDialogProps> = ({ open, onOpenChange, suggestion, attributes, branchId, isSubmitting, onSubmit }) => {
  // Estado del formulario: solo le interesa a este diálogo; se reinicia con la propuesta cada vez que se abre
  const [newVariantSku, setNewVariantSku] = useState('');
  const [newVariantBarcode, setNewVariantBarcode] = useState('');
  const [newVariantPurchasePrice, setNewVariantPurchasePrice] = useState('0');
  const [newVariantSalePrice, setNewVariantSalePrice] = useState('0');
  const [newVariantWholesalePrice, setNewVariantWholesalePrice] = useState('');
  const [newVariantInitialStock, setNewVariantInitialStock] = useState('0');
  const [newVariantSelectedValues, setNewVariantSelectedValues] = useState<Record<string, string>>({}); // attrId -> valueId

  useEffect(() => {
    if (!open) return;
    setNewVariantSku(suggestion.sku);
    setNewVariantBarcode('');
    setNewVariantPurchasePrice(suggestion.purchasePrice);
    setNewVariantSalePrice(suggestion.salePrice);
    setNewVariantWholesalePrice(suggestion.wholesalePrice);
    setNewVariantInitialStock('0');
    setNewVariantSelectedValues({});
  }, [open, suggestion]);

  const submit = () => {
    if (!newVariantSku.trim()) {
      toast.warning('Por favor ingresa un SKU para la nueva variante.');
      return;
    }
    const selectedAttrValueIds = Object.values(newVariantSelectedValues).filter(Boolean);
    if (selectedAttrValueIds.length === 0) {
      toast.warning('Selecciona al menos un valor de atributo (ej. Talla o Color) para la nueva combinación.');
      return;
    }
    void onSubmit({
      sku: newVariantSku.trim().toUpperCase(),
      barcode: newVariantBarcode.trim() || undefined,
      purchasePrice: Number(newVariantPurchasePrice) || 0,
      salePrice: Number(newVariantSalePrice) || 0,
      wholesalePrice: newVariantWholesalePrice !== '' ? Number(newVariantWholesalePrice) : null,
      attributeValues: selectedAttrValueIds.map((id) => ({ attributeValueId: id })),
      stocks: branchId ? [{ branchId, quantity: Number(newVariantInitialStock) || 0 }] : [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-2xl bg-card border border-border shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border/60 bg-muted/20">
          <DialogTitle className="text-sm sm:text-base font-semibold text-secondary flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            Agregar Nueva Variante al Producto
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral mt-0.5">
            Selecciona la combinación de atributos y define el SKU y precios de la nueva variante.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Selección de Atributos */}
          <div className="space-y-3 p-4 rounded-xl border border-primary/25 bg-primary/5">
            <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-primary">
                Combinación de Atributos <span className="text-destructive">*</span>
              </span>
              <span className="text-xs text-neutral">
                {attributes.length} atributo(s) asignado(s)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {attributes.map((attr:Attribute) => (
                <div key={attr.id} className="space-y-1">
                  <FieldLabel className="text-xs text-secondary font-bold">
                    {attr.name}
                  </FieldLabel>
                  <select
                    value={newVariantSelectedValues[attr.id] || ''}
                    onChange={(e) =>
                      setNewVariantSelectedValues((prev) => ({
                        ...prev,
                        [attr.id]: e.target.value,
                      }))
                    }
                    className="w-full h-8.5 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  >
                    <option value="">Seleccionar {attr.name}...</option>
                    {(attr.values || []).map((val) => (
                      <option key={val.id} value={val.id}>
                        {val.value}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* SKU & Código de Barras */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
 <FieldLabel className="text-xs font-bold text-secondary">
                SKU de la Variante <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                value={newVariantSku}
                onChange={(e) =>
                  setNewVariantSku(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))
                }
                placeholder="Ej. CAM-AZU-XL"
                className="text-xs h-8.5 font-mono font-bold bg-background"
              />
            </div>
            <div className="space-y-1">
 <FieldLabel className="text-xs font-bold text-secondary">
                Código de Barras (Opcional)
              </FieldLabel>
              <Input
                value={newVariantBarcode}
                onChange={(e) => setNewVariantBarcode(e.target.value)}
                placeholder="Opcional"
                className="text-xs h-8.5 font-mono bg-background"
              />
            </div>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
 <FieldLabel className="text-xs font-bold text-secondary">
                P. Compra
              </FieldLabel>
              <Input
                type="number"
                step="0.01"
                value={newVariantPurchasePrice}
                onChange={(e) => setNewVariantPurchasePrice(e.target.value)}
                className="text-xs h-8.5 font-mono bg-background"
              />
            </div>
            <div className="space-y-1">
 <FieldLabel className="text-xs font-bold text-primary">
                P. Venta <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                type="number"
                step="0.01"
                value={newVariantSalePrice}
                onChange={(e) => setNewVariantSalePrice(e.target.value)}
                className="text-xs h-8.5 font-mono font-bold text-primary bg-background border-primary/30"
              />
            </div>
            <div className="space-y-1">
 <FieldLabel className="text-xs font-bold text-secondary">
                P. Mayoreo
              </FieldLabel>
              <Input
                type="number"
                step="0.01"
                placeholder="N/A"
                value={newVariantWholesalePrice}
                onChange={(e) => setNewVariantWholesalePrice(e.target.value)}
                className="text-xs h-8.5 font-mono bg-background"
              />
            </div>
          </div>

          {/* Stock inicial en sucursal */}
          {branchId && (
            <div className="space-y-1 pt-1 border-t border-border/50">
 <FieldLabel className="text-xs font-bold text-secondary">
                Stock Inicial en Sucursal Seleccionada
              </FieldLabel>
              <Input
                type="number"
                step="1"
                value={newVariantInitialStock}
                onChange={(e) => setNewVariantInitialStock(e.target.value)}
                className="text-xs h-8.5 font-mono w-32 bg-background"
              />
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={submit}
            disabled={isSubmitting}
            className="text-xs font-bold gap-1.5 cursor-pointer shadow-sm shadow-primary/20"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Crear Variante
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
