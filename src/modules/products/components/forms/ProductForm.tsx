/**
 * ProductForm — shared form UI for creating and editing products.
 *
 * Highly space-optimized to reduce or eliminate the need for scrolling
 * on standard screens by placing related inputs on two parallel columns (grid-cols-2).
 */
import React, { useState } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { Loader2, Plus, Tag as TagIcon, Upload, X, ImageIcon, Check } from 'lucide-react';
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
import type { Tag } from '../../services/products.service';

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
  uploadedImages?: UploadedImage[];
  selectedImages: { id: string; url: string; description?: string }[];
  onRemoveImage: (id: string) => void;
  onOpenGalleryModal: () => void;
  onOpenUploadModal: () => void;
  isCreatingCategoryInline: boolean;
  onToggleCategoryInline: () => void;
  newCategoryName: string;
  onNewCategoryNameChange: (val: string) => void;
  onCreateCategory: () => void;
  isCreatingCategory: boolean;
  isEdit?: boolean;
  // Tags
  allTags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag: (name: string) => Promise<Tag>;
  isCreatingTag?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  form,
  formId,
  onSubmit,
  categories,
  selectedImages,
  onRemoveImage,
  onOpenGalleryModal,
  onOpenUploadModal,
  isCreatingCategoryInline,
  onToggleCategoryInline,
  newCategoryName,
  onNewCategoryNameChange,
  onCreateCategory,
  isCreatingCategory,
  isEdit = false,
  allTags,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
  isCreatingTag = false,
}) => {
  const [tagInput, setTagInput] = useState('');
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const filteredTags = allTags.filter(
    (t) => t.name.toLowerCase().includes(tagInput.toLowerCase())
  );
  const canCreate = tagInput.trim().length > 0 && !allTags.some(
    (t) => t.name.toLowerCase() === tagInput.trim().toLowerCase()
  );

  const handleCreateTag = async () => {
    const name = tagInput.trim();
    if (!name) return;
    const newTag = await onCreateTag(name);
    onToggleTag(newTag.id);
    setTagInput('');
    setTagDropdownOpen(false);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (canCreate) handleCreateTag();
    }
    if (e.key === 'Escape') setTagDropdownOpen(false);
  };
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
                  Código SKU <span className="text-destructive">*</span>
                </FieldLabel>
                <div className="relative">
                  <TagIcon className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
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
                  <TagIcon className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
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

          {/* Precios (3 columnas: Compra, Venta Unidad, Venta Mayorista) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <Controller
              name="purchasePrice"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-purchase-price`} className="text-[11px] font-bold uppercase tracking-wider truncate">
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
                  <FieldLabel htmlFor={`${formId}-sale-price`} className="text-[11px] font-bold uppercase tracking-wider truncate">
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

            <Controller
              name="wholesalePrice"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-wholesale-price`} className="text-[11px] font-bold uppercase tracking-wider truncate">
                    Precio Mayoreo ($)
                  </FieldLabel>
                  <Input
                    id={`${formId}-wholesale-price`}
                    type="number"
                    step="0.01"
                    placeholder="Opcional"
                    aria-invalid={fieldState.invalid}
                    className="text-xs h-9"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? null : parseFloat(e.target.value);
                      field.onChange(val);
                    }}
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
                  {isEdit ? 'Stock' : 'Stock Inicial'} <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id={`${formId}-stock`}
                  type="number"
                  aria-invalid={fieldState.invalid}
                  className="text-xs h-9"
                  value={field.value}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                  onBlur={field.onBlur}
                  disabled={isEdit}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {/* Tags */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5">
              Tags
            </label>
            {selectedTagIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedTagIds.map((id) => {
                  const tag = allTags.find((t) => t.id === id);
                  if (!tag) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold border border-primary/30"
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => onToggleTag(id)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => { setTagInput(e.target.value); setTagDropdownOpen(true); }}
                onFocus={() => setTagDropdownOpen(true)}
                onBlur={() => setTimeout(() => setTagDropdownOpen(false), 150)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Buscar o crear tag..."
                className="w-full text-xs h-9 bg-background border border-input rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-ring"
              />
              {tagDropdownOpen && (filteredTags.length > 0 || canCreate) && (
                <div className="absolute z-30 top-full mt-1 left-0 right-0 bg-popover border border-border rounded-xl shadow-xl max-h-44 overflow-y-auto">
                  {filteredTags.map((tag) => {
                    const selected = selectedTagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onMouseDown={() => { onToggleTag(tag.id); setTagInput(''); setTagDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-accent transition-colors ${
                          selected ? 'text-primary font-semibold' : 'text-foreground'
                        }`}
                      >
                        {tag.name}
                        {selected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
                  {canCreate && (
                    <button
                      type="button"
                      onMouseDown={handleCreateTag}
                      disabled={isCreatingTag}
                      className="w-full text-left px-3 py-2 text-xs text-primary font-semibold flex items-center gap-1.5 hover:bg-accent transition-colors border-t border-border"
                    >
                      {isCreatingTag ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Crear "{tagInput.trim()}"
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
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
    </form>
  );
};

export default ProductForm;
