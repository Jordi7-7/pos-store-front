import React, { useState } from 'react';
import { toast } from 'sonner';
import { Tag as TagIcon, Plus, Check, Loader2, Layers, AlertTriangle, X } from 'lucide-react';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import { MAX_ATTRIBUTES_PER_PRODUCT, MAX_VARIANTS, WARN_VARIANTS } from '../../../domain/rules/variable-wizard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { AttributeEntity, AttributeValueEntity } from '../../../domain/entities/catalog.entity';

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
  const [isCreatingAttrInline, setIsCreatingAttrInline] = useState(false);
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newValueMap, setNewValueMap] = useState<Record<string, string>>({});
  const [attributeFilter, setAttributeFilter] = useState('');

  const handleCreateAttribute = async () => {
    if (!newAttributeName.trim()) return;
    try {
      const created = await createAttribute(newAttributeName.trim());
      onActivateAttribute(created.id);
      setNewAttributeName('');
      setIsCreatingAttrInline(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo crear el atributo.'));
    }
  };

  const handleCreateValue = async (attributeId: string) => {
    const val = newValueMap[attributeId]?.trim();
    if (!val) return;
    try {
      const created = await createAttributeValue({ attributeId, value: val });
      setNewValueMap((prev) => ({ ...prev, [attributeId]: '' }));
      onToggleValue(attributeId, created.id);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo crear la opción.'));
    }
  };

  const activeAttributes = activeAttributeIds.map((id) => attributes.find((attribute) => attribute.id === id)).filter((attribute): attribute is AttributeEntity => attribute !== undefined);
  const filterText = attributeFilter.trim().toLowerCase();
  const availableAttributes = attributes.filter((attribute) => !activeAttributeIds.includes(attribute.id) && attribute.name.toLowerCase().includes(filterText));
  const SHOWN_AVAILABLE = 12;

  // Calculate combinations summary
  const activeAttributesWithSelections = attributes.filter(
    (attr) => (selectedAttributeValues[attr.id] || []).length > 0
  );

  const estimatedCombinations = activeAttributesWithSelections.reduce(
    (acc, attr) => acc * (selectedAttributeValues[attr.id]?.length || 1),
    activeAttributesWithSelections.length > 0 ? 1 : 0
  );

  return (
    <Card className="border-border shadow-xs bg-card overflow-hidden">
      <CardHeader className="pb-4 border-b border-border/50 bg-muted/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm sm:text-base font-bold text-secondary">
                Opciones
              </CardTitle>
              {estimatedCombinations > 0 && (
                <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20 text-xs font-mono font-bold">
                  {estimatedCombinations} {estimatedCombinations === 1 ? 'variante' : 'variantes'}
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-neutral mt-0.5">
              Marca lo que cambia entre variantes (p. ej. tallas S, M, L y colores Azul, Negro). La tabla de abajo se arma sola y conserva lo que ya escribiste.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {onNavigateToAttributes && (
              <>
                <button
                  type="button"
                  onClick={onNavigateToAttributes}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <TagIcon className="w-3.5 h-3.5" />
                  <span>Catálogo de atributos</span>
                </button>
                <span className="text-neutral/30 font-light">|</span>
              </>
            )}
            <Button
              type="button"
              variant={isCreatingAttrInline ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setIsCreatingAttrInline(!isCreatingAttrInline)}
              className="text-xs h-8 gap-1 cursor-pointer font-semibold"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              {isCreatingAttrInline ? 'Cerrar' : 'Crear atributo'}
            </Button>
          </div>
        </div>

        {/* Combinations formula preview bar */}
        {activeAttributesWithSelections.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap items-center gap-2 text-xs text-secondary font-medium">
 <span className="text-xs text-neutral font-bold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Cálculo:
            </span>
            <div className="flex items-center flex-wrap gap-1.5 font-mono text-xs">
              {activeAttributesWithSelections.map((attr, idx) => {
                const count = selectedAttributeValues[attr.id]?.length || 0;
                return (
                  <React.Fragment key={attr.id}>
                    {idx > 0 && <span className="text-neutral/50 font-bold">&times;</span>}
                    <span className="bg-background px-2 py-0.5 rounded-md border border-border">
                      {count} {attr.name.toLowerCase()}
                    </span>
                  </React.Fragment>
                );
              })}
              <span className="text-neutral/50 font-bold">=</span>
              <span className="bg-primary text-primary-foreground font-bold px-2 py-0.5 rounded-md shadow-xs">
                {estimatedCombinations} variantes en total
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-5">
        {estimatedCombinations > WARN_VARIANTS && (
          <div role="status" className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${estimatedCombinations > MAX_VARIANTS ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {estimatedCombinations > MAX_VARIANTS
                ? `Con estas opciones saldrían ${estimatedCombinations} variantes y el máximo por producto es ${MAX_VARIANTS}. Quita algunas opciones.`
                : `Saldrían ${estimatedCombinations} variantes: la tabla será larga. Si no vendes todas las combinaciones, quita opciones o separa el producto en dos.`}
            </span>
          </div>
        )}
        {/* Inline Attribute Creator */}
        {isCreatingAttrInline && (
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex-1">
 <span className="text-xs font-bold text-primary mb-1 block">
                Nuevo atributo
              </span>
              <Input
                placeholder="Nombre del atributo (p. ej. Talla, Color, Material)"
                value={newAttributeName}
                onChange={(e) => setNewAttributeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateAttribute();
                  }
                }}
                className="text-xs h-9 bg-background"
                autoFocus
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateAttribute}
              disabled={isCreatingAttribute || !newAttributeName.trim()}
              className="h-9 px-4 text-xs shrink-0 self-end sm:self-end cursor-pointer font-bold shadow-xs"
            >
              {isCreatingAttribute ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Crear atributo'}
            </Button>
          </div>
        )}

        {/* Loading / Empty / Attributes Grid */}
        {isLoadingAttributes ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs text-neutral">Cargando atributos del catálogo...</span>
          </div>
        ) : attributes.length === 0 ? (
          <div className="p-10 text-center border-2 border-dashed border-border rounded-2xl bg-muted/10">
            <TagIcon className="w-8 h-8 text-neutral/40 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-secondary mb-1">Aún no hay atributos registrados</h4>
            <p className="text-xs text-neutral max-w-sm mx-auto">
              Haz clic en "Crear Atributo" arriba para registrar el primer tipo de atributo (ej. Talla o Color) y sus opciones.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Atributos del catálogo: se agregan los que cambian en este producto */}
            <div className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-xs font-bold text-secondary">
                  Atributos del producto <span className="font-normal text-neutral">({activeAttributes.length} de {MAX_ATTRIBUTES_PER_PRODUCT})</span>
                </span>
                {attributes.length > SHOWN_AVAILABLE && (
                  <Input
                    value={attributeFilter}
                    onChange={(e) => setAttributeFilter(e.target.value)}
                    placeholder={`Buscar entre ${attributes.length} atributos…`}
                    aria-label="Buscar atributo"
                    className="h-8 max-w-xs bg-background text-xs"
                  />
                )}
              </div>
              {availableAttributes.length === 0 ? (
                <p className="text-xs text-neutral">{filterText ? 'Ningún atributo coincide con la búsqueda.' : 'Ya agregaste todos los atributos del catálogo.'}</p>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-neutral">Agregar:</span>
                  {availableAttributes.slice(0, SHOWN_AVAILABLE).map((attribute) => (
                    <button
                      key={attribute.id}
                      type="button"
                      onClick={() => {
                        setAttributeFilter('');
                        onActivateAttribute(attribute.id);
                      }}
                      className="flex cursor-pointer items-center gap-1 rounded-md border border-dashed border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
                    >
                      <Plus className="h-3 w-3" />
                      {attribute.name}
                    </button>
                  ))}
                  {availableAttributes.length > SHOWN_AVAILABLE && <span className="text-xs text-neutral">y {availableAttributes.length - SHOWN_AVAILABLE} más: usa el buscador</span>}
                </div>
              )}
            </div>

            {activeAttributes.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border bg-muted/10 p-8 text-center text-xs text-neutral">Agrega un atributo (por ejemplo, talla o color) para elegir sus opciones.</div>
            ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAttributes.map((attr) => {
              const selectedVals = selectedAttributeValues[attr.id] || [];
              const valInput = newValueMap[attr.id] || '';
              const hasSelection = selectedVals.length > 0;

              return (
                <div
                  key={attr.id}
                  className={`p-4 rounded-xl border transition-all duration-200 space-y-3.5 shadow-2xs ${
                    hasSelection
                      ? 'border-primary/40 bg-card ring-1 ring-primary/20'
                      : 'border-border bg-card/60 hover:border-border/80'
                  }`}
                >
                  {/* Card Header for Attribute */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <TagIcon className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-bold text-secondary">
                        {attr.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasSelection ? (
                        <Badge className="bg-primary text-primary-foreground text-xs font-mono font-bold shadow-2xs">
                          {selectedVals.length} {selectedVals.length === 1 ? 'marcada' : 'marcadas'}
                        </Badge>
                      ) : (
                        <span className="text-xs text-neutral font-medium">Ninguna marcada</span>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeactivateAttribute(attr.id)}
                        aria-label={`Quitar el atributo ${attr.name}`}
                        title="Quitar este atributo del producto"
                        className="cursor-pointer rounded-md p-1 text-neutral transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Chips of values */}
                  <div className="flex max-h-40 min-h-[36px] flex-wrap items-center gap-1.5 overflow-y-auto rounded-lg border border-border/40 bg-muted/20 p-2">
                    {(attr.values || []).map((val) => {
                      const isChecked = selectedVals.includes(val.id);
                      return (
                        <button
                          key={val.id}
                          type="button"
                          onClick={() => onToggleValue(attr.id, val.id)}
                          className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all flex items-center gap-1.5 select-none cursor-pointer ${
                            isChecked
                              ? 'bg-primary text-primary-foreground border-primary shadow-xs font-bold scale-102'
                              : 'bg-background hover:bg-muted text-foreground border-border/70 hover:border-border'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{val.value}</span>
                        </button>
                      );
                    })}
                    {(attr.values || []).length === 0 && (
                      <span className="text-xs text-neutral italic px-1">
                        Sin valores. Agrega opciones abajo.
                      </span>
                    )}
                  </div>

                  {/* Add value input inline */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <Input
                      placeholder={`Agregar opción a ${attr.name} (ej. Negro, XL)...`}
                      value={valInput}
                      onChange={(e) =>
                        setNewValueMap((prev) => ({ ...prev, [attr.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateValue(attr.id);
                        }
                      }}
                      className="text-xs h-8 bg-background"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateValue(attr.id)}
                      disabled={isCreatingValue || !valInput.trim()}
                      className="h-8 text-xs shrink-0 cursor-pointer font-semibold hover:border-primary hover:text-primary"
                    >
                      {isCreatingValue ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

