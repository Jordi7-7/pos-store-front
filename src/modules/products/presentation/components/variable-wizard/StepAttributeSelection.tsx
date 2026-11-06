import React, { useState } from 'react';
import { Tag as TagIcon, Plus, Check, Loader2, Sparkles, Layers, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface StepAttributeSelectionProps {
  attributes: any[];
  isLoadingAttributes: boolean;
  selectedAttributeValues: Record<string, string[]>;
  onToggleValue: (attrId: string, valId: string) => void;
  createAttribute: (name: string) => Promise<any>;
  isCreatingAttribute: boolean;
  createAttributeValue: (payload: { attributeId: string; value: string }) => Promise<any>;
  isCreatingValue: boolean;
  onNavigateToAttributes?: () => void;
  onBack: () => void;
  onGenerateAndProceed: () => void;
}

export const StepAttributeSelection: React.FC<StepAttributeSelectionProps> = ({
  attributes,
  isLoadingAttributes,
  selectedAttributeValues,
  onToggleValue,
  createAttribute,
  isCreatingAttribute,
  createAttributeValue,
  isCreatingValue,
  onNavigateToAttributes,
  onBack,
  onGenerateAndProceed,
}) => {
  const [isCreatingAttrInline, setIsCreatingAttrInline] = useState(false);
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newValueMap, setNewValueMap] = useState<Record<string, string>>({});

  const handleCreateAttribute = async () => {
    if (!newAttributeName.trim()) return;
    try {
      await createAttribute(newAttributeName.trim());
      setNewAttributeName('');
      setIsCreatingAttrInline(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateValue = async (attributeId: string) => {
    const val = newValueMap[attributeId]?.trim();
    if (!val) return;
    try {
      const created = await createAttributeValue({ attributeId, value: val });
      setNewValueMap((prev) => ({ ...prev, [attributeId]: '' }));
      onToggleValue(attributeId, created.id);
    } catch (e) {
      console.error(e);
    }
  };

  // Calculate combinations summary
  const activeAttributesWithSelections = attributes.filter(
    (attr) => (selectedAttributeValues[attr.id] || []).length > 0
  );

  const estimatedCombinations = activeAttributesWithSelections.reduce(
    (acc, attr) => acc * (selectedAttributeValues[attr.id]?.length || 1),
    activeAttributesWithSelections.length > 0 ? 1 : 0
  );

  const totalValuesSelected = Object.values(selectedAttributeValues).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

  return (
    <Card className="border-border shadow-xs bg-card overflow-hidden">
      <CardHeader className="pb-4 border-b border-border/50 bg-muted/15">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm sm:text-base font-bold text-secondary">
                2. Selección de Atributos y Opciones
              </CardTitle>
              {estimatedCombinations > 0 && (
                <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20 text-[11px] font-mono font-bold">
                  {estimatedCombinations} variante(s) resultante(s)
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs text-neutral mt-0.5">
              Marca los valores que aplican para este producto (ej. Tallas: S, M, L y Colores: Azul, Negro).
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
                  <span>Catálogo Global</span>
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
              {isCreatingAttrInline ? 'Cerrar creador' : 'Crear Atributo'}
            </Button>
          </div>
        </div>

        {/* Combinations formula preview bar */}
        {activeAttributesWithSelections.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap items-center gap-2 text-xs text-secondary font-medium">
            <span className="text-[11px] uppercase tracking-wider text-neutral font-bold flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-primary" />
              Cálculo:
            </span>
            <div className="flex items-center flex-wrap gap-1.5 font-mono text-[11px]">
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
        {/* Inline Attribute Creator */}
        {isCreatingAttrInline && (
          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1 block">
                Nuevo Tipo de Atributo Global
              </span>
              <Input
                placeholder="Nombre del atributo (ej. Talla, Color, Material)..."
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
              {isCreatingAttribute ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Registrar Atributo'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attributes.map((attr) => {
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

                    {hasSelection ? (
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-mono font-bold shadow-2xs">
                        {selectedVals.length} seleccionado(s)
                      </Badge>
                    ) : (
                      <span className="text-[10px] text-neutral font-medium">
                        Ninguno marcado
                      </span>
                    )}
                  </div>

                  {/* Chips of values */}
                  <div className="flex flex-wrap gap-1.5 min-h-[36px] items-center p-2 rounded-lg bg-muted/20 border border-border/40">
                    {(attr.values || []).map((val: any) => {
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
                      <span className="text-[11px] text-neutral italic px-1">
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

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-10 px-4 text-xs font-semibold cursor-pointer"
          >
            &larr; Volver a Ficha
          </Button>

          <Button
            type="button"
            onClick={onGenerateAndProceed}
            disabled={totalValuesSelected === 0}
            className="h-10 px-5 text-xs font-bold gap-2 cursor-pointer shadow-sm shadow-primary/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generar Variantes ({estimatedCombinations})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

