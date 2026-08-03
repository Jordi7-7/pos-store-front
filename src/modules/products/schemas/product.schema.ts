import * as z from 'zod';

// ---------------------------------------------------------------------------
// Product form schema (shared between Create and Edit)
// ---------------------------------------------------------------------------
export const productFormSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede superar los 100 caracteres.'),
  description: z
    .string()
    .max(500, 'La descripción no puede superar los 500 caracteres.')
    .optional(),
  categoryId: z.string().optional(),
  sku: z
    .string()
    .min(1, 'El código SKU / Barras es requerido.')
    .max(60, 'El código no puede superar los 60 caracteres.'),
  purchasePrice: z
    .number({ error: 'Ingresa un precio válido.' })
    .min(0, 'El precio de compra no puede ser negativo.'),
  salePrice: z
    .number({ error: 'Ingresa un precio válido.' })
    .min(0.01, 'El precio de venta debe ser mayor a 0.'),
  initialStock: z
    .number({ error: 'Ingresa una cantidad válida.' })
    .int('El stock debe ser un número entero.')
    .min(0, 'El stock no puede ser negativo.'),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

// ---------------------------------------------------------------------------
// Default values factory (useful for both create and edit)
// ---------------------------------------------------------------------------
export const productFormDefaults: ProductFormValues = {
  name: '',
  description: '',
  categoryId: '',
  sku: '',
  purchasePrice: 10.0,
  salePrice: 19.99,
  initialStock: 50,
};
