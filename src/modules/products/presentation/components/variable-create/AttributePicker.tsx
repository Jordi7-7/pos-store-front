import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, Tag as TagIcon } from 'lucide-react';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import { choicesFrom, countCombinations } from '../../../domain/rules/variable-wizard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AttributeEntity, AttributeValueEntity } from '../../../domain/entities/catalog.entity';
import { AttributeAdder } from './AttributeAdder';
import { AttributeOptionsCard } from './AttributeOptionsCard';
import { CombinationsFormula, TooManyVariantsNotice } from './CombinationsSummary';
import { NewAttributeForm } from './NewAttributeForm';

interface AttributePickerProps {
  attributes: AttributeEntity[];
  isLoadingAttributes: boolean;
  selectedAttributeValues: Record<string, string[]>;
  /** Atributos con los que se está armando el producto (los demás del catálogo se agregan a demanda). */
  activeAttributeIds: string[];
  onActivateAttribute: (attributeId: string) => void;
  onDeactivateAttribute: (attributeId: string) => void;
  onToggleValue: (attrId: string, valId: string) => void;
  createAttribute: (name: string) => Promise<AttributeEntity>;
  isCreatingAttribute: boolean;
  createAttributeValue: (payload: { attributeId: string; value: string }) => Promise<AttributeValueEntity>;
  isCreatingValue: boolean;
  onNavigateToAttributes?: () => void;
}

/** Elige con qué atributos y opciones se arma el producto; de ahí sale la tabla de variantes. */
export const AttributePicker: React.FC<AttributePickerProps> = ({
  attributes,
  isLoadingAttributes,
  selectedAttributeValues,
  activeAttributeIds,
  onActivateAttribute,
  onDeactivateAttribute,
  onToggleValue,
  createAttribute,
  isCreatingAttribute,
  createAttributeValue,
  isCreatingValue,
  onNavigateToAttributes,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleCreateAttribute = async (name: string) => {
    try {
      const created = await createAttribute(name);
      onActivateAttribute(created.id);
      setIsFormOpen(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo crear el atributo.'));
    }
  };

  const handleCreateValue = async (attributeId: string, value: string) => {
    try {
      const created = await createAttributeValue({ attributeId, value });
      onToggleValue(attributeId, created.id);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo crear la opción.'));
    }
  };

  const activeAttributes = activeAttributeIds.map((id) => attributes.find((attribute) => attribute.id === id)).filter((attribute): attribute is AttributeEntity => attribute !== undefined);
  const choices = choicesFrom(selectedAttributeValues, attributes);
  const total = countCombinations(choices);

  return (
    <Card className="overflow-hidden border-border bg-card shadow-xs">
      <CardHeader className="border-b border-border/50 bg-muted/15 pb-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold text-secondary sm:text-base">Opciones</CardTitle>
              {total > 0 && <Badge className="border-primary/30 bg-primary/15 font-mono text-xs font-bold text-primary hover:bg-primary/20">{total} {total === 1 ? 'variante' : 'variantes'}</Badge>}
            </div>
            <CardDescription className="mt-0.5 text-xs text-neutral">
              Marca lo que cambia entre variantes (p. ej. tallas S, M, L y colores Azul, Negro). La tabla de abajo se arma sola y conserva lo que ya escribiste.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {onNavigateToAttributes && (
              <>
                <button type="button" onClick={onNavigateToAttributes} className="flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 hover:underline">
                  <TagIcon className="size-3.5" />
                  <span>Catálogo de atributos</span>
                </button>
                <span className="font-light text-neutral/30">|</span>
              </>
            )}
            <Button type="button" variant={isFormOpen ? 'secondary' : 'outline'} size="sm" onClick={() => setIsFormOpen((open) => !open)} className="h-8 cursor-pointer gap-1 text-xs font-semibold">
              <Plus className="size-3.5 text-primary" />
              {isFormOpen ? 'Cerrar' : 'Crear atributo'}
            </Button>
          </div>
        </div>
        {choices.length > 0 && <CombinationsFormula choices={choices} total={total} />}
      </CardHeader>

      <CardContent className="space-y-5 p-5 sm:p-6">
        <TooManyVariantsNotice total={total} />
        {isFormOpen && <NewAttributeForm isCreating={isCreatingAttribute} onCreate={handleCreateAttribute} />}

        {isLoadingAttributes ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="text-xs text-neutral">Cargando atributos del catálogo...</span>
          </div>
        ) : attributes.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-muted/10 p-10 text-center">
            <TagIcon className="mx-auto mb-2 size-8 text-neutral/40" />
            <h4 className="mb-1 text-xs font-bold text-secondary">Aún no hay atributos registrados</h4>
            <p className="mx-auto max-w-sm text-xs text-neutral">Haz clic en "Crear atributo" arriba para registrar el primer tipo de atributo (ej. Talla o Color) y sus opciones.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AttributeAdder attributes={attributes} activeAttributeIds={activeAttributeIds} onActivate={onActivateAttribute} />
            {activeAttributes.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border bg-muted/10 p-8 text-center text-xs text-neutral">Agrega un atributo (por ejemplo, talla o color) para elegir sus opciones.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {activeAttributes.map((attribute) => (
                  <AttributeOptionsCard
                    key={attribute.id}
                    attribute={attribute}
                    selectedValueIds={selectedAttributeValues[attribute.id] ?? []}
                    isCreatingValue={isCreatingValue}
                    onToggleValue={(valueId) => onToggleValue(attribute.id, valueId)}
                    onRemove={() => onDeactivateAttribute(attribute.id)}
                    onCreateValue={(value) => handleCreateValue(attribute.id, value)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
