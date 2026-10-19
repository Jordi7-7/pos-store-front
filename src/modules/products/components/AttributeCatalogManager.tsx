import React, { useState } from 'react';
import { 
  Tag as TagIcon, 
  Plus, 
  Loader2, 
  Search, 
  Check, 
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

import { useAttributes } from '../hooks/useAttributes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { AttributeDTO as Attribute } from '../types';

export const AttributeCatalogManager: React.FC = () => {
  const { 
    attributes, 
    isLoading, 
    createAttribute, 
    isCreatingAttribute, 
    createAttributeValue, 
    isCreatingValue 
  } = useAttributes();

  // Create attribute modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAttrName, setNewAttrName] = useState('');
  const [search, setSearch] = useState('');

  // Values map for inputs: attributeId -> string text
  const [newValueMap, setNewValueMap] = useState<Record<string, string>>({});

  const handleCreateAttribute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newAttrName.trim()) return;

    try {
      const created = await createAttribute(newAttrName.trim());
      setNewAttrName('');
      setIsModalOpen(false);
      toast.success(`Atributo "${created.name}" creado con éxito.`);
    } catch (err: any) {
      toast.error(err.message || 'Error al crear el atributo.');
    }
  };

  const handleAddValue = async (attributeId: string) => {
    const valText = newValueMap[attributeId]?.trim();
    if (!valText) return;

    try {
      const created = await createAttributeValue({ attributeId, value: valText });
      setNewValueMap((prev) => ({ ...prev, [attributeId]: '' }));
      toast.success(`Valor "${created.value}" agregado al catálogo.`);
    } catch (err: any) {
      toast.error(err.message || 'Error al agregar el valor.');
    }
  };

  const filteredAttributes = attributes.filter((attr:Attribute) =>
    attr.name.toLowerCase().includes(search.toLowerCase()) ||
    (attr.values || []).some((v) => v.value.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header bar with counter, search and "+" button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-secondary flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Atributos Registrados ({attributes.length})
          </h4>
          <p className="text-xs text-neutral mt-0.5">
            Administra los atributos globales y sus valores. Al crear productos podrás seleccionar los que apliquen.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* Live Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral" />
            <Input
              placeholder="Buscar atributo o valor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>

          {/* Clean "+" New Attribute Button */}
          <Button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="h-9 px-3.5 text-xs font-bold gap-1.5 cursor-pointer shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Atributo</span>
          </Button>
        </div>
      </div>

      {/* Attributes Grid Listing */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs text-neutral">Cargando catálogo de atributos...</span>
        </div>
      ) : filteredAttributes.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-xl">
          <TagIcon className="w-8 h-8 text-neutral/50 mx-auto mb-2" />
          <p className="text-xs text-neutral">
            {search ? 'No se encontraron atributos que coincidan con la búsqueda.' : 'No hay atributos creados aún.'}
          </p>
          {!search && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="mt-3 text-xs gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear el primer atributo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAttributes.map((attr:Attribute) => {
            const valInput = newValueMap[attr.id] || '';
            const vals = attr.values || [];

            return (
              <Card key={attr.id} className="shadow-2xs border-border flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                          <TagIcon className="w-3.5 h-3.5" />
                        </span>
                        <CardTitle className="text-sm font-bold text-secondary truncate">
                          {attr.name}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {vals.length} valores
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pb-3">
                    {/* Values Pills */}
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 border border-border/50 rounded-lg bg-muted/20 min-h-12 items-start content-start">
                      {vals.map((v) => (
                        <span
                          key={v.id}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-background border border-border font-medium text-foreground shadow-2xs"
                        >
                          <Check className="w-2.5 h-2.5 text-primary" />
                          {v.value}
                        </span>
                      ))}
                      {vals.length === 0 && (
                        <span className="text-[11px] text-neutral italic p-1">
                          Sin valores aún. Agrega uno abajo.
                        </span>
                      )}
                    </div>
                  </CardContent>
                </div>

                {/* Add Value Input Form Footer */}
                <div className="p-4 pt-0 border-t border-border/60 mt-auto">
                  <div className="flex items-center gap-1.5 pt-3">
                    <Input
                      placeholder={`Nuevo valor para ${attr.name}...`}
                      value={valInput}
                      onChange={(e) =>
                        setNewValueMap((prev) => ({ ...prev, [attr.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddValue(attr.id);
                        }
                      }}
                      className="text-xs h-8"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAddValue(attr.id)}
                      disabled={isCreatingValue || !valInput.trim()}
                      className="h-8 text-xs shrink-0 cursor-pointer"
                      title="Agregar valor"
                    >
                      {isCreatingValue ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal / Dialog para Crear Atributo */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-secondary flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-primary" />
              Nuevo Atributo Global
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral">
              Ingresa el nombre del atributo que compartirán los productos de tu tienda (ej. Talla, Color, Presentación, Capacidad).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAttribute} className="space-y-4 py-2">
            <Field>
              <FieldLabel htmlFor="new-attr-input" className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                Nombre del Atributo <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="new-attr-input"
                autoFocus
                placeholder="Ej. Talla, Color, Acabado..."
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                className="text-xs h-9"
              />
            </Field>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="text-xs h-9"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreatingAttribute || !newAttrName.trim()}
                className="text-xs h-9 font-bold"
              >
                {isCreatingAttribute && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Guardar Atributo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttributeCatalogManager;
