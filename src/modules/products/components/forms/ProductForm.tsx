/**
 * ProductForm — shared form UI for creating and editing products.
 *
 * Highly space-optimized to reduce or eliminate the need for scrolling
 * on standard screens by placing related inputs on two parallel columns (grid-cols-2).
 */
import React from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { Check, Loader2, Plus, Tag, Upload } from 'lucide-react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import type { ProductFormValues } from '../../schemas/product.schema';

interface Category {
  id: string;
  name: string;
}

interface UploadedImage {
  id: string;
  url: string;
  description: string;
}

export interface ProductFormProps {
  form: UseFormReturn<ProductFormValues>;
  formId: string;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  categories: Category[];
  uploadedImages: UploadedImage[];
  selectedImages: string[];
  onToggleImage: (id: string) => void;
  onOpenUploadModal: () => void;
  isCreatingCategoryInline: boolean;
  onToggleCategoryInline: () => void;
  newCategoryName: string;
  onNewCategoryNameChange: (val: string) => void;
  onCreateCategory: () => void;
  isCreatingCategory: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  form,
  formId,
  onSubmit,
  categories,
  uploadedImages,
  selectedImages,
  onToggleImage,
  onOpenUploadModal,
  isCreatingCategoryInline,
  onToggleCategoryInline,
  newCategoryName,
  onNewCategoryNameChange,
  onCreateCategory,
  isCreatingCategory,
}) => {
  return (
    <form
      id={formId}
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="space-y-4 text-secondary"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT COLUMN: Main Info */}
        <div className="space-y-3.5">
          {/* Nombre */}
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${formId}-name`} className="text-[11px] font-bold uppercase tracking-wider">
                  Nombre del Producto <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  {...field}
                  id={`${formId}-name`}
                  placeholder="Ej. Coca Cola 500ml"
                  aria-invalid={fieldState.invalid}
                  className="text-xs h-9"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Categoría */}
          <Controller
            name="categoryId"
            control={form.control}
            render={({ field }) => {
              const selectedCategory = categories.find((cat) => cat.id === field.value);
              const displayValue = selectedCategory ? selectedCategory.name : '';

              return (
                <Field>
                  <FieldLabel htmlFor={`${formId}-category`} className="text-[11px] font-bold uppercase tracking-wider">Categoría</FieldLabel>
                  <div className="flex gap-1.5 items-center">
                    <div className="flex-1">
                      <Combobox
                        value={field.value || 'none'}
                        onValueChange={(val) => field.onChange(val === 'none' ? '' : val)}
                      >
                        <ComboboxInput
                          id={`${formId}-category`}
                          placeholder="Buscar o seleccionar categoría..."
                          className="text-xs shadow-none h-9"
                          showTrigger
                          value={displayValue}
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>No se encontraron categorías.</ComboboxEmpty>
                          <ComboboxList>
                            <ComboboxItem value="none">Ninguna (Opcional)</ComboboxItem>
                            {categories.map((cat) => (
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
                      onClick={onToggleCategoryInline}
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
                <FieldLabel htmlFor={`${formId}-new-cat`} className="text-[9px] uppercase tracking-wider font-bold">
                  Nombre de Nueva Categoría <span className="text-destructive">*</span>
                </FieldLabel>
                <div className="flex gap-2">
                  <Input
                    id={`${formId}-new-cat`}
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => onNewCategoryNameChange(e.target.value)}
                    placeholder="Ej. Bebidas, Snacks"
                    className="flex-1 text-xs h-8"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={onCreateCategory}
                    disabled={isCreatingCategory}
                  >
                    {isCreatingCategory && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                    Crear
                  </Button>
                </div>
              </Field>
            </div>
          )}

          {/* Descripción */}
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${formId}-description`} className="text-[11px] font-bold uppercase tracking-wider">Descripción</FieldLabel>
                <Textarea
                  {...field}
                  id={`${formId}-description`}
                  placeholder="Ingresa descripción o notas del artículo..."
                  aria-invalid={fieldState.invalid}
                  className="text-xs h-[72px] resize-none"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>

        {/* RIGHT COLUMN: Inventory & Prices */}
        <div className="space-y-3.5">
          {/* SKU / Código */}
          <Controller
            name="sku"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${formId}-sku`} className="text-[11px] font-bold uppercase tracking-wider">
                  Código SKU Propio <span className="text-destructive">*</span>
                </FieldLabel>
                <div className="relative">
                  <Tag className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    {...field}
                    id={`${formId}-sku`}
                    placeholder="HM-1230 (Para etiquetas propias)"
                    aria-invalid={fieldState.invalid}
                    className="pl-8 text-xs h-9"
                  />
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Código de Barras Proveedor */}
          <Controller
            name="barcode"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${formId}-barcode`} className="text-[11px] font-bold uppercase tracking-wider">
                  Código de Barras Proveedor
                </FieldLabel>
                <div className="relative">
                  <Tag className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    {...field}
                    id={`${formId}-barcode`}
                    placeholder="Código de barras original (Opcional)"
                    aria-invalid={fieldState.invalid}
                    className="pl-8 text-xs h-9"
                  />
                </div>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Precios (2 columnas internas) */}
          <div className="grid grid-cols-2 gap-2.5">
            <Controller
              name="purchasePrice"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-purchase-price`} className="text-[11px] font-bold uppercase tracking-wider">
                    Compra ($) <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={`${formId}-purchase-price`}
                    type="number"
                    step="0.01"
                    aria-invalid={fieldState.invalid}
                    className="text-xs h-9"
                    value={field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    onBlur={field.onBlur}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="salePrice"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-sale-price`} className="text-[11px] font-bold uppercase tracking-wider">
                    Venta ($) <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={`${formId}-sale-price`}
                    type="number"
                    step="0.01"
                    aria-invalid={fieldState.invalid}
                    className="text-xs h-9"
                    value={field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    onBlur={field.onBlur}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          {/* Stock */}
          <Controller
            name="initialStock"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${formId}-stock`} className="text-[11px] font-bold uppercase tracking-wider">
                  Stock Inicial <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id={`${formId}-stock`}
                  type="number"
                  aria-invalid={fieldState.invalid}
                  className="text-xs h-9"
                  value={field.value}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  onBlur={field.onBlur}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </div>

      {/* FOOTER ROW: Images Section (Optimized row style) */}
      <div className="border-t border-border/40 pt-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Imágenes de la Galería{' '}
            <span className="text-muted-foreground font-normal">({selectedImages.length} seleccionadas)</span>
          </span>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onOpenUploadModal}
            className="text-[11px] h-auto p-0 gap-1"
          >
            <Upload className="w-3.5 h-3.5" />
            + Subir Nueva Imagen
          </Button>
        </div>

        {uploadedImages.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1 border border-border/50 rounded-xl p-2 bg-muted/10">
            {uploadedImages.map((img) => {
              const isSelected = selectedImages.includes(img.id);
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => onToggleImage(img.id)}
                  title={img.description}
                  className={`relative w-12 h-12 rounded-lg border-2 overflow-hidden shrink-0 transition-all ${
                    isSelected
                      ? 'border-primary scale-95 shadow-md shadow-primary/20'
                      : 'border-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    className="w-full h-full object-cover"
                    alt={img.description}
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="h-14 border border-dashed border-border rounded-xl flex items-center justify-center text-muted-foreground text-[10px]">
            No tienes imágenes subidas aún. Haz click en "+ Subir Nueva Imagen".
          </div>
        )}
      </div>
    </form>
  );
};

export default ProductForm;
