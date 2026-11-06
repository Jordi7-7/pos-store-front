import React, { useState } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { toast } from 'sonner';
import { Package, Loader2, Plus, Trash2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { CategoryEntity } from '../../../domain/entities/catalog.entity';
import type { ImageItem, ParentFormValues } from '../../hooks/useParentInfoForm';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';

interface ParentInfoTabProps {
  control: Control<ParentFormValues>;
  categories: CategoryEntity[];
  createCategory: (name: string) => Promise<CategoryEntity>;
  isCreatingCategory: boolean;
  images: ImageItem[];
  onImagesChange: (images: ImageItem[]) => void;
  onOpenGallery: () => void;
  onOpenUpload: () => void;
}

/** Ficha general del producto padre: nombre, SKU base, categoría (con alta en línea), descripción y fotos. */
export const ParentInfoTab: React.FC<ParentInfoTabProps> = ({ control, categories, createCategory, isCreatingCategory, images, onImagesChange, onOpenGallery, onOpenUpload }) => {
  // Alta de categoría en línea: estado que solo usa esta pestaña
  const [isCreatingCategoryInline, setIsCreatingCategoryInline] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreateCategory = async (onChange: (id: string) => void) => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await createCategory(newCategoryName.trim());
      onChange(created.id);
      setNewCategoryName('');
      setIsCreatingCategoryInline(false);
      toast.success('¡Categoría creada e incorporada!');
    } catch (e) {
      toast.error(getErrorMessage(e, 'Error al crear la categoría.'));
    }
  };

  return (
          <Card className="border-border shadow-xs bg-card">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/15">
              <CardTitle className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-primary" />
                Datos del Producto Padre
              </CardTitle>
              <CardDescription className="text-xs text-neutral">
                Los cambios aquí se aplicarán a la ficha principal del producto y su categorización global.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Nombre */}
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Field className="md:col-span-1">
                      <FieldLabel className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                        Nombre del Producto <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input {...field} placeholder="Ej. Playera Oversize" className="text-xs h-9 bg-background" />
                    </Field>
                  )}
                />

                {/* SKU Base */}
                <Controller
                  name="baseSku"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                        SKU Base / Modelo
                      </FieldLabel>
                      <Input
                        {...field}
                        placeholder="Ej. KHKASER3"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                        className="text-xs h-9 bg-background font-mono font-bold"
                      />
                    </Field>
                  )}
                />

                {/* Categoría */}
                <Controller
                  name="categoryId"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <div className="flex items-center justify-between">
                        <FieldLabel className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                          Categoría
                        </FieldLabel>
                        <button
                          type="button"
                          onClick={() => setIsCreatingCategoryInline(!isCreatingCategoryInline)}
                          className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                        >
                          {isCreatingCategoryInline ? 'Cancelar' : '+ Nueva'}
                        </button>
                      </div>

                      {isCreatingCategoryInline ? (
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Nombre de categoría..."
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="text-xs h-9 bg-background"
                          />
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleCreateCategory(field.onChange)}
                            disabled={isCreatingCategory || !newCategoryName.trim()}
                            className="h-9 text-xs font-bold"
                          >
                            {isCreatingCategory ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Crear'}
                          </Button>
                        </div>
                      ) : (
                        <select
                          value={field.value || ''}
                          onChange={field.onChange}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                        >
                          <option value="">Sin categoría asignada</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Descripción */}
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                      Descripción
                    </FieldLabel>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Detalles del producto..."
                      className="text-xs bg-background"
                    />
                  </Field>
                )}
              />

              {/* Imágenes */}
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <FieldLabel className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                      Fotografías Principales
                    </FieldLabel>
                    <p className="text-[11px] text-neutral">
                      Fotografías compartidas asociadas a la ficha padre del producto.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenGallery()}
                      className="text-xs h-8 cursor-pointer font-semibold"
                    >
                      <ImageIcon className="w-3.5 h-3.5 mr-1 text-primary" />
                      Galería
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenUpload()}
                      className="text-xs h-8 cursor-pointer font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Subir
                    </Button>
                  </div>
                </div>

                {images.length > 0 ? (
                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-border group shadow-2xs"
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => onImagesChange(images.filter((i) => i.id !== img.id))}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-5 rounded-xl border border-dashed border-border bg-muted/20 text-center">
                    <p className="text-[11px] text-neutral italic">Sin fotografías adjuntas al producto.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
  );
};
