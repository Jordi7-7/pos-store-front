import React, { useState } from 'react';
import { Settings, Plus, Loader2, Tag } from 'lucide-react';
import { useAttributes } from '../hooks/useAttributes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const AttributesTab: React.FC = () => {
  const {
    attributes,
    isLoading,
    createAttribute,
    isCreatingAttribute,
    createAttributeValue,
    isCreatingValue
  } = useAttributes();

  const [attrName, setAttrName] = useState('');
  const [newValueMap, setNewValueMap] = useState<Record<string, string>>({});

  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrName.trim()) return;
    try {
      await createAttribute(attrName.trim());
      setAttrName('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddValue = async (attributeId: string) => {
    const valueText = newValueMap[attributeId]?.trim();
    if (!valueText) return;

    try {
      await createAttributeValue({ attributeId, value: valueText });
      setNewValueMap({ ...newValueMap, [attributeId]: '' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left side: Create new Attribute */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-xs flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Nuevo Atributo
          </CardTitle>
          <CardDescription className="text-xs">
            Define las características de variación (ej. Talla, Color, Material).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAttribute} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-wider">Nombre del Atributo</Label>
              <Input
                type="text"
                required
                value={attrName}
                onChange={(e) => setAttrName(e.target.value)}
                placeholder="Ej. Talla, Color, Material"
                className="text-xs"
              />
            </div>
            <Button
              type="submit"
              disabled={isCreatingAttribute || !attrName.trim()}
              className="w-full text-xs"
            >
              {isCreatingAttribute ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Plus className="w-4 h-4 mr-1" />
              )}
              Crear Atributo
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Right side: List and add values */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-xs">Atributos y Valores Configurados</CardTitle>
          <CardDescription className="text-xs">Administra los valores específicos de cada tipo de variación.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Cargando atributos...</span>
            </div>
          ) : attributes.length === 0 ? (
            <div className="h-40 border border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground text-xs">
              No tienes atributos registrados todavía.
            </div>
          ) : (
            <div className="space-y-4">
              {attributes.map((attr) => (
                <div key={attr.id} className="p-4 bg-muted/20 border border-border rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="text-xs font-bold uppercase flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-primary" />
                      {attr.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">ID: {attr.id.substring(0, 8)}...</span>
                  </div>

                  {/* Values list */}
                  <div className="flex flex-wrap gap-1.5">
                    {attr.values && attr.values.length > 0 ? (
                      attr.values.map((v: any) => (
                        <Badge key={v.id} variant="outline" className="text-xs">
                          {v.value}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[11px] text-muted-foreground italic">Sin valores creados. Agrega uno abajo.</span>
                    )}
                  </div>

                  {/* Add new value */}
                  <div className="flex gap-2 pt-1.5">
                    <Input
                      type="text"
                      placeholder="Nuevo valor (ej. Rojo, XL, Madera)"
                      value={newValueMap[attr.id] || ''}
                      onChange={(e) => setNewValueMap({ ...newValueMap, [attr.id]: e.target.value })}
                      className="flex-1 text-xs"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAddValue(attr.id)}
                      disabled={isCreatingValue || !newValueMap[attr.id]?.trim()}
                      className="text-xs"
                    >
                      {isCreatingValue ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                      Agregar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
