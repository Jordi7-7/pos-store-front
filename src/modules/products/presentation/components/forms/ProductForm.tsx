/**
 * ProductForm — shared form UI for creating and editing products.
 *
 * Highly space-optimized to reduce or eliminate the need for scrolling
 * on standard screens by placing related inputs on two parallel columns (grid-cols-2).
 */
import React from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { Tag as TagIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { CategoryField } from './fields/CategoryField';
import { PriceFields } from './fields/PriceFields';
import { ProductImagesField } from './fields/ProductImagesField';
import { TagsField } from './fields/TagsField';
import type { ProductFormValues } from './product-form.schema';
import type { TagEntity as Tag } from '../../../domain/entities/catalog.entity';

interface Category {
  id: string;
  name: string;
}

export interface ProductFormProps {
  form: UseFormReturn<ProductFormValues>;
  formId: string;
  onSubmit: (data: ProductFormValues) => Promise<void>;
  categories: Category[];
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
  return (
    <form
      id={formId}
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="space-y-4 text-secondary"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT COLUMN: Identifiers & Details */}
        <div className="space-y-3.5">
          {/* 1. Código SKU */}
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

          {/* 2. Código de Barras Proveedor */}
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

          {/* 3. Nombre del Producto */}
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

          <PriceFields control={form.control} formId={formId} />
        </div>

        {/* RIGHT COLUMN: Description, Category, Stock & Tags */}
        <div className="space-y-3.5">
          {/* 1. Descripción */}
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
                  className="text-xs h-9 py-2 resize-none"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <CategoryField
            control={form.control}
            formId={formId}
            categories={categories}
            isCreatingCategoryInline={isCreatingCategoryInline}
            onToggleCategoryInline={onToggleCategoryInline}
            newCategoryName={newCategoryName}
            onNewCategoryNameChange={onNewCategoryNameChange}
            onCreateCategory={onCreateCategory}
            isCreatingCategory={isCreatingCategory}
          />

          {/* 4. Stock Inicial */}
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

          <TagsField allTags={allTags} selectedTagIds={selectedTagIds} onToggleTag={onToggleTag} onCreateTag={onCreateTag} isCreatingTag={isCreatingTag} />
        </div>
      </div>


      <ProductImagesField selectedImages={selectedImages} onRemoveImage={onRemoveImage} onOpenGalleryModal={onOpenGalleryModal} onOpenUploadModal={onOpenUploadModal} />
    </form>
  );
};

export default ProductForm;
