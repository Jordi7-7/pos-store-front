import React, { useState } from 'react';
import { Check, Loader2, Plus, Tag as TagIcon, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AttributeEntity } from '../../../domain/entities/catalog.entity';

interface AttributeOptionsCardProps {
  attribute: AttributeEntity;
  /** Ids de las opciones marcadas para este producto. */
  selectedValueIds: readonly string[];
  isCreatingValue: boolean;
  onToggleValue: (valueId: string) => void;
  onRemove: () => void;
  /** Crea una opción nueva en el catálogo; el atributo la marca solo al recibirla. */
  onCreateValue: (value: string) => Promise<void>;
}

/** Un atributo del producto: sus opciones como botones que se marcan, y una caja para agregar una opción nueva. */
export const AttributeOptionsCard: React.FC<AttributeOptionsCardProps> = ({ attribute, selectedValueIds, isCreatingValue, onToggleValue, onRemove, onCreateValue }) => {
  const [newValue, setNewValue] = useState('');
  const hasSelection = selectedValueIds.length > 0;
  const values = attribute.values ?? [];

  const create = async () => {
    const text = newValue.trim();
    if (!text) return;
    await onCreateValue(text);
    setNewValue('');
  };

  return (
    <div className={`space-y-3.5 rounded-xl border p-4 shadow-2xs transition-all duration-200 ${hasSelection ? 'border-primary/40 bg-card ring-1 ring-primary/20' : 'border-border bg-card/60 hover:border-border/80'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TagIcon className="size-3.5" />
          </span>
          <span className="text-xs font-bold text-secondary">{attribute.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasSelection ? (
            <Badge className="bg-primary font-mono text-xs font-bold text-primary-foreground shadow-2xs">
              {selectedValueIds.length} {selectedValueIds.length === 1 ? 'marcada' : 'marcadas'}
            </Badge>
          ) : (
            <span className="text-xs font-medium text-neutral">Ninguna marcada</span>
          )}
          <button type="button" onClick={onRemove} aria-label={`Quitar el atributo ${attribute.name}`} title="Quitar este atributo del producto" className="cursor-pointer rounded-md p-1 text-neutral transition-colors hover:bg-rose-500/10 hover:text-rose-500">
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex max-h-40 min-h-[36px] flex-wrap items-center gap-1.5 overflow-y-auto rounded-lg border border-border/40 bg-muted/20 p-2">
        {values.map((value) => {
          const checked = selectedValueIds.includes(value.id);
          return (
            <button
              key={value.id}
              type="button"
              onClick={() => onToggleValue(value.id)}
              className={`flex cursor-pointer select-none items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${checked ? 'scale-102 border-primary bg-primary font-bold text-primary-foreground shadow-xs' : 'border-border/70 bg-background text-foreground hover:border-border hover:bg-muted'}`}
            >
              {checked && <Check className="size-3 stroke-[3]" />}
              <span>{value.value}</span>
            </button>
          );
        })}
        {values.length === 0 && <span className="px-1 text-xs italic text-neutral">Sin valores. Agrega opciones abajo.</span>}
      </div>

      <div className="flex items-center gap-1.5 pt-1">
        <Input
          placeholder={`Agregar opción a ${attribute.name} (ej. Negro, XL)...`}
          value={newValue}
          onChange={(event) => setNewValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void create();
            }
          }}
          className="h-8 bg-background text-xs"
        />
        <Button type="button" variant="outline" size="sm" onClick={() => void create()} disabled={isCreatingValue || !newValue.trim()} className="h-8 shrink-0 cursor-pointer text-xs font-semibold hover:border-primary hover:text-primary">
          {isCreatingValue ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <>
              <Plus className="size-3.5" />
              <span>Agregar</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
