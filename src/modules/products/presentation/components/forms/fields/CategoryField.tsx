import React from 'react';
import { Controller, type Control } from 'react-hook-form';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { ProductFormValues } from '../product-form.schema';

interface CategoryFieldProps {
  control: Control<ProductFormValues>;
  formId: string;
  categories: Array<{ id: string; name: string }>;
  isCreatingCategoryInline: boolean;
  onToggleCategoryInline: () => void;
  newCategoryName: string;
  onNewCategoryNameChange: (val: string) => void;
  onCreateCategory: () => void;
  isCreatingCategory: boolean;
}

/** Categoría del producto: selector con búsqueda y alta de una nueva en línea. */
export const CategoryField: React.FC<CategoryFieldProps> = ({ control, formId, categories, isCreatingCategoryInline, onToggleCategoryInline, newCategoryName, onNewCategoryNameChange, onCreateCategory, isCreatingCategory }) => (
  <>
<Controller
  name="categoryId"
  control={control}
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
  </>
);
