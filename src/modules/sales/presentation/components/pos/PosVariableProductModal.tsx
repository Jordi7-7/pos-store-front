import React, { useRef, useState } from 'react';
import { Package, Check, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { formatMoney } from '@/modules/auth/presentation/hooks/useSession';
import type { PosVariableProductEntity } from '@/modules/products/domain/entities/catalog.entity';
import type { CartProductRef, CartVariantRef } from '../../../domain/entities/cart-item';
import { attributeChoices, preferredVariant, sameCombination, selectOption } from '../../../domain/rules/variant-selection';

export interface PosVariableProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productData: PosVariableProductEntity | null;
  onAddToCart: (product: CartProductRef, variant: CartVariantRef, maxStock: number) => void;
  /** Texto del botón que confirma (en un cambio no va al carrito). */
  confirmLabel?: string;
}

/** Elegir la variante de un producto escaneado por su SKU base. */
export const PosVariableProductModal: React.FC<PosVariableProductModalProps> = ({ isOpen, productData, ...props }) => {
  if (!isOpen || !productData) return null;
  // La clave reinicia la selección al pasar a otro producto
  return <VariantPicker key={productData.productId} product={productData} {...props} />;
};

interface VariantPickerProps extends Pick<PosVariableProductModalProps, 'onClose' | 'onAddToCart' | 'confirmLabel'> {
  product: PosVariableProductEntity;
}

interface ChipProps {
  label: string;
  selected: boolean;
  inStock: boolean;
  onClick: () => void;
}

function Chip({ label, selected, inStock, onClick }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer flex items-center gap-1.5 ${
        selected
          ? 'bg-primary border-primary text-white'
          : `bg-bg-dark border-border-card text-neutral hover:border-neutral/50 hover:text-secondary ${inStock ? '' : 'border-dashed'}`
      }`}
    >
      {selected && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
      <span>{label}</span>
      {!inStock && (
        <>
          {/* El espacio separa las palabras para los lectores de pantalla */}{' '}
          <span className={`font-normal ${selected ? 'text-white/70' : 'text-rose-500'}`}>sin stock</span>
        </>
      )}
    </button>
  );
}

function VariantPicker({ product, onClose, onAddToCart, confirmLabel = 'Agregar al carrito' }: VariantPickerProps) {
  const { attributes, variants } = product;
  const [selectedId, setSelectedId] = useState(() => preferredVariant(variants)?.id);
  // El foco queda en el contenido y no en un botón: el Enter de un lector de códigos no debe pulsar nada
  const contentRef = useRef<HTMLDivElement>(null);
  const selected = variants.find((variant) => variant.id === selectedId) ?? preferredVariant(variants);
  if (!selected) return null;

  const choices = attributeChoices(attributes, variants, selected);
  const twins = sameCombination(attributes, variants, selected);
  const image = selected.imageUrl || product.imageUrl;

  const confirm = () => {
    if (selected.stock <= 0) {
      toast.warning(`Aviso: El stock de la variante "${selected.sku}" quedará en negativo (Stock disponible: ${selected.stock} pzs.)`);
    }
    onAddToCart(
      { id: product.productId, name: product.productName, type: product.productType },
      {
        id: selected.id,
        sku: selected.sku,
        salePrice: selected.salePrice,
        wholesalePrice: selected.wholesalePrice,
        attributes: selected.attributes ?? [],
        imageUrl: image,
      },
      selected.stock,
    );
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent initialFocus={contentRef} className="sm:max-w-md flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0">
        <div ref={contentRef} tabIndex={-1} className="flex min-h-0 flex-col outline-none">
          <div className="p-4 px-5 pr-12 border-b border-border-card">
            <DialogTitle className="text-base font-semibold text-secondary truncate">{product.productName}</DialogTitle>
            <DialogDescription className="text-xs font-mono mt-1">
              {product.baseSku ? `SKU base: ${product.baseSku}` : 'Elige la variante'}
            </DialogDescription>
          </div>

          <div className="p-5 overflow-y-auto space-y-5">
            <div className="flex gap-4 items-center bg-bg-dark/60 border border-border-card/60 p-3.5 rounded-xl">
              <div className="w-28 h-28 rounded-lg border border-border-card bg-bg-card shrink-0 overflow-hidden flex items-center justify-center">
                {image ? (
                  // La clave evita que se quede la foto anterior mientras carga la nueva
                  <img key={image} src={image} alt={`${product.productName} ${selected.sku}`} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-neutral/40" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <span className="font-mono text-xs font-bold text-primary block truncate">{selected.sku}</span>
                <span className="text-xl font-bold font-mono text-secondary block">{formatMoney(selected.salePrice)}</span>
                <span
                  className={`inline-flex text-xs font-bold px-2 py-0.5 rounded-md border ${
                    selected.stock > 0 ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' : 'bg-rose-500/15 text-rose-600 border-rose-500/30'
                  }`}
                >
                  {selected.stock > 0 ? `${selected.stock} disponibles` : `Sin stock (${selected.stock} pzs)`}
                </span>
              </div>
            </div>

            {choices.map((choice) => (
              <div key={choice.attributeId} role="group" aria-label={choice.name} className="space-y-2">
                <p className="text-xs font-bold text-secondary">{choice.name}</p>
                <div className="flex flex-wrap gap-2">
                  {choice.options.map((option) => (
                    <Chip
                      key={option.valueId}
                      label={option.label}
                      selected={option.selected}
                      inStock={option.inStock}
                      onClick={() => setSelectedId(selectOption(attributes, variants, selected, choice.attributeId, option.valueId).id)}
                    />
                  ))}
                </div>
              </div>
            ))}

            {twins.length > 1 && (
              <div role="group" aria-label="SKU" className="space-y-2">
                <p className="text-xs font-bold text-secondary">SKU</p>
                <div className="flex flex-wrap gap-2">
                  {twins.map((variant) => (
                    <Chip key={variant.id} label={variant.sku} selected={variant.id === selected.id} inStock={variant.stock > 0} onClick={() => setSelectedId(variant.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 px-5 border-t border-border-card bg-bg-dark/30 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirm}>
              <ShoppingCart />
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
