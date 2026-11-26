import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MAX_ATTRIBUTES_PER_PRODUCT } from '../../../domain/rules/variable-wizard';
import type { AttributeEntity } from '../../../domain/entities/catalog.entity';

/** Cuántos atributos disponibles se muestran como botones antes de pedir que se use el buscador. */
const SHOWN_AVAILABLE = 12;

interface AttributeAdderProps {
  /** Todos los atributos del catálogo. */
  attributes: readonly AttributeEntity[];
  activeAttributeIds: readonly string[];
  onActivate: (attributeId: string) => void;
}

/** Los atributos del catálogo que aún no están en el producto, con buscador cuando son muchos (el catálogo puede tener decenas). */
export const AttributeAdder: React.FC<AttributeAdderProps> = ({ attributes, activeAttributeIds, onActivate }) => {
  const [filter, setFilter] = useState('');
  const filterText = filter.trim().toLowerCase();
  const available = attributes.filter((attribute) => !activeAttributeIds.includes(attribute.id) && attribute.name.toLowerCase().includes(filterText));

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="text-xs font-bold text-secondary">
          Atributos del producto <span className="font-normal text-neutral">({activeAttributeIds.length} de {MAX_ATTRIBUTES_PER_PRODUCT})</span>
        </span>
        {attributes.length > SHOWN_AVAILABLE && <Input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder={`Buscar entre ${attributes.length} atributos…`} aria-label="Buscar atributo" className="h-8 max-w-xs bg-background text-xs" />}
      </div>
      {available.length === 0 ? (
        <p className="text-xs text-neutral">{filterText ? 'Ningún atributo coincide con la búsqueda.' : 'Ya agregaste todos los atributos del catálogo.'}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-neutral">Agregar:</span>
          {available.slice(0, SHOWN_AVAILABLE).map((attribute) => (
            <button
              key={attribute.id}
              type="button"
              onClick={() => {
                setFilter('');
                onActivate(attribute.id);
              }}
              className="flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
            >
              <Plus className="size-3" />
              {attribute.name}
            </button>
          ))}
          {available.length > SHOWN_AVAILABLE && <span className="text-xs text-neutral">y {available.length - SHOWN_AVAILABLE} más: usa el buscador</span>}
        </div>
      )}
    </div>
  );
};
