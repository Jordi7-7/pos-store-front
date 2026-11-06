import React from 'react';
import { Controller, type Control } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { CurrencySymbol } from '@/modules/auth/presentation/hooks/CurrencySymbol';
import type { ProductFormValues } from '../product-form.schema';

/** Precios de compra, venta y mayoreo (el de mayoreo es opcional), con la moneda de la tienda. */
export const PriceFields: React.FC<{ control: Control<ProductFormValues>; formId: string }> = ({ control, formId }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
    <Controller
      name="purchasePrice"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
 <FieldLabel htmlFor={`${formId}-purchase-price`} className="text-xs font-bold truncate">
            Compra (<CurrencySymbol />) <span className="text-destructive">*</span>
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
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
 <FieldLabel htmlFor={`${formId}-sale-price`} className="text-xs font-bold truncate">
            Venta (<CurrencySymbol />) <span className="text-destructive">*</span>
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
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
 <FieldLabel htmlFor={`${formId}-wholesale-price`} className="text-xs font-bold truncate">
            Precio Mayoreo (<CurrencySymbol />)
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
);
