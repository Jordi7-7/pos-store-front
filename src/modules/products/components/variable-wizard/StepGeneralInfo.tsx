import React, { useState } from 'react';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';
import { Loader2, Plus, Tag as TagIcon, Upload, X, ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';

export interface VariableProductHeaderValues {
  name: string;
  baseSku: string;
  description?: string;
  categoryId?: string;
}

interface StepGeneralInfoProps {
  control: Control<VariableProductHeaderValues>;
  errors: FieldErrors<VariableProductHeaderValues>;
  categories: any[];
  createCategory: (name: string) => Promise<any>;
  isCreatingCategory: boolean;
  selectedImages: { id: string; url: string; description?: string }[];
  onRemoveImage: (id: string) => void;
  onOpenGalleryModal: () => void;
  onOpenUploadModal: () => void;
  onNext: () => void;
}

export const StepGeneralInfo: React.FC<StepGeneralInfoProps> = ({
  control,
  categories,
  createCategory,
  isCreatingCategory,
  selectedImages,
  onRemoveImage,
  onOpenGalleryModal,
  onOpenUploadModal,
  onNext,
}) => {
  const [isCreatingCategoryInline, setIsCreatingCategoryInline] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleCreateCategory = async (onChange: (val: string) => void) => {
    if (!newCategoryName.trim()) return;
    try {
      const created = await createCategory(newCategoryName.trim());
      onChange(created.id);
      setNewCategoryName('');
      setIsCreatingCategoryInline(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card className="border-border shadow-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-sm">Ficha del Producto Compuesto</CardTitle>
        <CardDescription className="text-xs">
          Información base de catalogación general y de variantes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LEFT COLUMN */}
          <div className="space-y-3.5">
            {/* Código Base / SKU */}
            <Controller
              name="baseSku"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="var-base-sku" className="text-[11px] font-bold uppercase tracking-wider">
                    Código SKU Base <span className="text-destructive">*</span>
                  </FieldLabel>
                  <div className="relative">
                    <TagIcon className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      {...field}
                      id="var-base-sku"
                      placeholder="HM-1230 (Prefijo de las variantes)"
                      aria-invalid={fieldState.invalid}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                      className="pl-8 text-xs h-9"
                    />
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Nombre del Producto */}
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="var-prod-name" className="text-[11px] font-bold uppercase tracking-wider">
                    Nombre del Producto <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="var-prod-name"
                    placeholder="Ej. Playera Oversize"
                    aria-invalid={fieldState.invalid}
                    className="text-xs h-9"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-3.5">
            {/* Descripción */}
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="var-description" className="text-[11px] font-bold uppercase tracking-wider">
                    Descripción
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="var-description"
                    placeholder="Ingresa descripción o notas del artículo..."
                    aria-invalid={fieldState.invalid}
                    className="text-xs h-9 py-2 resize-none"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {/* Categoría */}
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => {
                const selectedCategory = categories.find((cat: any) => cat.id === field.value);
                const displayValue = selectedCategory ? selectedCategory.name : '';

                return (
                  <Field>
                    <FieldLabel htmlFor="var-category" className="text-[11px] font-bold uppercase tracking-wider">
                      Categoría
                    </FieldLabel>
                    <div className="flex gap-1.5 items-center">
                      <div className="flex-1">
                        <Combobox
                          value={field.value || 'none'}
                          onValueChange={(val) => field.onChange(val === 'none' ? '' : val)}
                        >
                          <ComboboxInput
                            id="var-category"
                            placeholder="Buscar o seleccionar categoría..."
                            className="text-xs shadow-none h-9"
                            showTrigger
                            value={displayValue}
                          />
                          <ComboboxContent>
                            <ComboboxEmpty>No se encontraron categorías.</ComboboxEmpty>
                            <ComboboxList>
                              <ComboboxItem value="none">Ninguna (Opcional)</ComboboxItem>
                              {categories.map((cat: any) => (
                                <ComboboxItem key={cat.id} value={cat.id}>
                                  {cat.name}
                                </ComboboxItem>
                              ))}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setIsCreatingCategoryInline(!isCreatingCategoryInline)}
                        title="Crear Nueva Categoría"
                        className="shrink-0 h-9 w-9"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </Field>
                );
              }}
            />

            {/* Nueva Categoría Inline */}
            {isCreatingCategoryInline && (
              <div className="bg-muted/20 border border-border/50 rounded-xl p-2.5 space-y-1.5 animate-fade-in">
                <Field>
                  <FieldLabel htmlFor="var-new-cat" className="text-[9px] uppercase tracking-wider font-bold">
                    Nombre de Nueva Categoría <span className="text-destructive">*</span>
                  </FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      id="var-new-cat"
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ej. Ropa, Calzado"
                      className="flex-1 text-xs h-8"
                    />
                    <Controller
                      name="categoryId"
                      control={control}
                      render={({ field }) => (
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleCreateCategory(field.onChange)}
                          disabled={isCreatingCategory || !newCategoryName.trim()}
                        >
                          {isCreatingCategory && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                          Crear
                        </Button>
                      )}
                    />
                  </div>
                </Field>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER ROW: Selected Product Images */}
        <div className="border-t border-border/40 pt-3 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                Imágenes del Producto{' '}
                <span className="text-muted-foreground font-normal">({selectedImages.length})</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenGalleryModal}
                className="text-xs h-7 px-2.5 gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5 text-primary" />
                Seleccionar de la Galería
              </Button>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={onOpenUploadModal}
                className="text-[11px] h-auto p-0 gap-1 text-primary"
              >
                <Upload className="w-3.5 h-3.5" />
                + Subir Nueva Imagen
              </Button>
            </div>
          </div>

          {selectedImages.length > 0 ? (
            <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-1 border border-border/50 rounded-xl p-2.5 bg-muted/10">
              {selectedImages.map((img, index) => (
                <div
                  key={img.id}
                  className="group relative w-16 h-16 rounded-xl border border-border overflow-hidden shrink-0 shadow-xs bg-background"
                  title={img.description || 'Imagen del producto'}
                >
                  <img
                    src={img.url}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    alt={img.description || 'producto'}
                  />

                  {index === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-primary/90 text-primary-foreground text-[8px] font-semibold text-center py-0.5 leading-none">
                      Principal
                    </span>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => onRemoveImage(img.id)}
                    className="absolute top-1 right-1 w-4.5 h-4.5 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-sm"
                    title="Quitar imagen"
                  >
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              onClick={onOpenGalleryModal}
              className="h-16 border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 rounded-xl flex items-center justify-center gap-2 text-muted-foreground text-xs cursor-pointer transition-all"
            >
              <ImageIcon className="w-4 h-4 text-muted-foreground/60" />
              <span>Este producto aún no tiene imágenes. Haz click para <strong>Seleccionar de la Galería</strong></span>
            </div>
          )}
        </div>

        {/* Footer Navigation Button */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={onNext}
            className="w-full h-10 text-xs font-semibold cursor-pointer shadow-xs"
          >
            <span>Continuar a Selección de Atributos</span>
            <span aria-hidden="true" className="ml-1.5">&rarr;</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
