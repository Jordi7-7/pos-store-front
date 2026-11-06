import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import type { AttributeEntity } from '../../domain/entities/catalog.entity';
import {
  applyBulkValues,
  combinationsOf,
  findSkuProblem,
  generateVariantRows,
  resolveBaseSku,
  toggleAttributeValue,
  toVariableProductRequest,
  type AttributeChoice,
  type BulkValues,
  type SelectedValues,
  type WizardVariantRow,
} from '../../domain/rules/variable-wizard';
import type { VariableProductHeaderValues } from '../components/variable-wizard';
import { useProductMutations } from './useProductMutations';
import { useWizardImages } from './useWizardImages';

const headerSchema = z.object({
  name: z.string().min(1, 'El nombre del producto es obligatorio'),
  baseSku: z.string().min(1, 'El SKU base es obligatorio para un producto variable'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
});

const NO_BULK: BulkValues = { skuPrefix: '', purchasePrice: '', salePrice: '', wholesalePrice: '', stock: '' };

interface Options {
  branchId: string;
  attributes: AttributeEntity[];
  onSuccess?: () => void;
}

/**
 * Estado y pasos del asistente de producto compuesto (1 ficha → 2 atributos → 3 matriz y precios). Las reglas
 * —combinaciones, SKU, valores en bloque, validación y petición— están en `domain/rules/variable-wizard`.
 */
export function useVariableProductWizard({ branchId, attributes, onSuccess }: Options) {
  const [step, setStep] = useState(1);
  const [selectedValues, setSelectedValues] = useState<SelectedValues>({});
  const [rows, setRows] = useState<WizardVariantRow[]>([]);
  const [bulk, setBulk] = useState<BulkValues>(NO_BULK);
  const { createVariableProduct, isCreatingVariable } = useProductMutations();

  const form = useForm<VariableProductHeaderValues>({
    resolver: zodResolver(headerSchema),
    defaultValues: { name: '', baseSku: '', description: '', categoryId: '' },
  });
  const baseSkuHeader = form.watch('baseSku');
  const images = useWizardImages(rows, setRows);

  const setBulkField = (field: keyof BulkValues) => (value: string) => setBulk((prev) => ({ ...prev, [field]: value }));

  const toggleValue = (attributeId: string, valueId: string) => setSelectedValues((prev) => toggleAttributeValue(prev, attributeId, valueId));

  const goToAttributes = async () => {
    if (!(await form.trigger(['name', 'baseSku']))) {
      toast.warning('Por favor completa el nombre y el SKU base antes de continuar.');
      return;
    }
    setStep(2);
  };

  const generateVariants = () => {
    const choices: AttributeChoice[] = Object.entries(selectedValues)
      .filter(([, valueIds]) => valueIds.length > 0)
      .map(([attributeId, valueIds]) => {
        const attribute = attributes.find((item) => item.id === attributeId);
        return {
          attributeId,
          attributeName: attribute?.name || 'Atributo',
          values: (attribute?.values ?? []).filter((value) => valueIds.includes(value.id)),
        };
      });
    if (choices.length === 0) {
      toast.warning('Selecciona al menos un valor de atributo para continuar.');
      return;
    }

    const baseSku = resolveBaseSku(baseSkuHeader, bulk.skuPrefix, form.getValues('name'));
    // El panel en bloque arranca con el SKU base, para que "aplicar a todas" no lo borre.
    if (!bulk.skuPrefix) setBulk((prev) => ({ ...prev, skuPrefix: baseSku }));

    const generated = generateVariantRows(combinationsOf(choices), baseSku, bulk, Date.now());
    setRows(generated);
    setStep(3);
    toast.success(`Se generaron ${generated.length} combinaciones.`);
  };

  const applyBulk = () => {
    if (rows.length === 0) return;
    setRows((prev) => applyBulkValues(prev, bulk));
    toast.success('Valores aplicados a todas las variantes.');
  };

  const updateField = (id: string, field: keyof WizardVariantRow, value: WizardVariantRow[keyof WizardVariantRow]) =>
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));

  const removeRow = (id: string) => {
    const remaining = rows.filter((row) => row.id !== id);
    setRows(remaining);
    if (remaining.length === 0) {
      setStep(2);
      toast.info('Se eliminaron todas las variantes. Regresaste a la selección de atributos.');
    }
  };

  const clearRows = () => {
    setRows([]);
    setStep(2);
  };

  const submit = async () => {
    if (!branchId) {
      toast.warning('Por favor selecciona una sucursal específica en la barra superior antes de guardar.');
      return;
    }
    if (rows.length === 0) {
      toast.warning('Debes tener al menos una variante para registrar el producto compuesto.');
      return;
    }
    const problem = findSkuProblem(rows);
    if (problem) {
      toast.error(problem);
      return;
    }
    try {
      await createVariableProduct(toVariableProductRequest(form.getValues(), rows, images.productImages, branchId, bulk.skuPrefix));
      toast.success('¡Producto compuesto y variantes registrados con éxito!');
      onSuccess?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al guardar el producto compuesto.'));
    }
  };

  return {
    step,
    setStep,
    form,
    baseSkuHeader,
    selectedValues,
    toggleValue,
    rows,
    bulk,
    setBulkField,
    images,
    isSubmitting: isCreatingVariable,
    goToAttributes,
    generateVariants,
    applyBulk,
    updateField,
    removeRow,
    clearRows,
    submit,
  };
}
