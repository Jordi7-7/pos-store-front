import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ApiError } from '@/shared/infrastructure/http/api-error';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import type { AttributeEntity } from '../../domain/entities/catalog.entity';
import {
  applyBulkValues,
  applyPaste,
  choicesFrom,
  combinationKey,
  combinationsOf,
  countCombinations,
  findRowIssues,
  hasBlockingIssues,
  MAX_ATTRIBUTES_PER_PRODUCT,
  MAX_VARIANTS,
  suggestBaseSku,
  syncRows,
  toggleAttributeValue,
  toVariableProductRequest,
  type BulkValues,
  type PasteColumn,
  type RowIssue,
  type SelectedValues,
  type WizardVariantRow,
} from '../../domain/rules/variable-wizard';
import type { VariableProductHeaderValues } from '../components/variable-create';
import { useProductMutations } from './useProductMutations';
import { useWizardImages } from './useWizardImages';

const headerSchema = z.object({
  name: z.string().min(1, 'El nombre del producto es obligatorio'),
  baseSku: z.string().min(1, 'El SKU base es obligatorio'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
});

const NO_BULK: BulkValues = { purchasePrice: '', salePrice: '', wholesalePrice: '', stock: '' };

interface Options {
  branchId: string;
  attributes: AttributeEntity[];
  onSuccess?: () => void;
}

/** SKU que el servidor dijo que ya existen (`SKU_TAKEN` trae la lista en `details.skus`). */
function takenSkusOf(error: unknown): string[] {
  if (!(error instanceof ApiError) || error.code !== 'SKU_TAKEN') return [];
  const details = error.details as { skus?: unknown } | null;
  return Array.isArray(details?.skus) ? details.skus.filter((sku): sku is string => typeof sku === 'string').map((sku) => sku.toUpperCase()) : [];
}

/**
 * Estado de la pantalla única de alta de producto con variantes (datos → opciones → tabla de variantes). La tabla se
 * mantiene al día sola al marcar o quitar opciones y conserva lo ya escrito; las reglas viven en `domain/rules/variable-wizard`.
 */
export function useVariableProductForm({ branchId, attributes, onSuccess }: Options) {
  const [selectedValues, setSelectedValues] = useState<SelectedValues>({});
  /** Atributos con los que se arma este producto, en el orden en que se agregaron. */
  const [activeAttributeIds, setActiveAttributeIds] = useState<string[]>([]);
  const [rows, setRows] = useState<WizardVariantRow[]>([]);
  /** Combinaciones que se quitaron a mano; siguen quitadas mientras sus opciones sigan marcadas. */
  const [removed, setRemoved] = useState<ReadonlySet<string>>(new Set());
  const [bulk, setBulk] = useState<BulkValues>(NO_BULK);
  /** Ya se intentó guardar: a partir de ahí se muestran también los errores de precios y stock (antes solo los de SKU). */
  const [attempted, setAttempted] = useState(false);
  const [takenSkus, setTakenSkus] = useState<ReadonlySet<string>>(new Set());
  const { createVariableProduct, isCreatingVariable } = useProductMutations();
  const nextId = useRef(0);
  const newId = () => `var-${++nextId.current}`;

  const form = useForm<VariableProductHeaderValues>({
    resolver: zodResolver(headerSchema),
    // Revalida al escribir: tras un intento de guardar con campos vacíos, el aviso se quita en cuanto se rellenan
    mode: 'onChange',
    defaultValues: { name: '', baseSku: '', description: '', categoryId: '' },
  });
  const baseSku = form.watch('baseSku') ?? '';
  const images = useWizardImages(rows, setRows);

  const choices = useMemo(() => choicesFrom(selectedValues, attributes), [selectedValues, attributes]);
  const combinationCount = countCombinations(choices);
  const allIssues = useMemo(() => findRowIssues(rows), [rows]);
  /** Lo que se muestra: una tabla recién generada no se llena de rojo por tener los precios aún en 0. */
  const issues = useMemo(() => {
    const visible: Record<string, RowIssue[]> = {};
    for (const [id, list] of Object.entries(allIssues)) {
      const shown = list.filter((issue) => attempted || issue.level === 'warning' || issue.field === 'sku');
      if (shown.length > 0) visible[id] = shown;
    }
    return visible;
  }, [allIssues, attempted]);
  /** Los problemas que impiden guardar, con la variante a la que pertenecen (para listarlos junto al botón). */
  const blockingMessages = useMemo(
    () => rows.flatMap((row) => (issues[row.id] ?? []).filter((issue) => issue.level === 'error').map((issue) => `${row.sku || row.combination.map((item) => item.valueName).join(' / ')}: ${issue.message}`)),
    [rows, issues],
  );

  /** Combinaciones de las opciones marcadas, menos las quitadas a mano. */
  const wantedCombinations = (nextChoices: typeof choices, nextRemoved: ReadonlySet<string>) =>
    combinationsOf(nextChoices).filter((combination) => !nextRemoved.has(combinationKey(combination)));

  const resync = (nextChoices: typeof choices, nextRemoved: ReadonlySet<string>, sku = baseSku) =>
    setRows((previous) => syncRows(previous, wantedCombinations(nextChoices, nextRemoved), sku.trim(), newId));

  // Si cambia el SKU base, los SKU que nadie tocó lo siguen
  useEffect(() => {
    setRows((previous) => (previous.length === 0 ? previous : syncRows(previous, previous.map((row) => row.combination), baseSku.trim(), newId)));
  }, [baseSku]);

  const toggleValue = (attributeId: string, valueId: string) => {
    const nextSelected = toggleAttributeValue(selectedValues, attributeId, valueId);
    const nextChoices = choicesFrom(nextSelected, attributes);
    if (countCombinations(nextChoices) > MAX_VARIANTS) {
      toast.error(`Con esa opción pasarías de ${MAX_VARIANTS} variantes, el máximo por producto.`);
      return;
    }
    // Las combinaciones quitadas a mano que ya no existen se olvidan (si se vuelve a marcar el valor, vuelven a salir)
    const stillPossible = new Set(combinationsOf(nextChoices).map(combinationKey));
    const nextRemoved = new Set([...removed].filter((key) => stillPossible.has(key)));
    setSelectedValues(nextSelected);
    setRemoved(nextRemoved);
    resync(nextChoices, nextRemoved);
  };

  const activateAttribute = (attributeId: string) => {
    if (activeAttributeIds.includes(attributeId)) return;
    if (activeAttributeIds.length >= MAX_ATTRIBUTES_PER_PRODUCT) {
      toast.warning(`Un producto combina como máximo ${MAX_ATTRIBUTES_PER_PRODUCT} atributos. Quita uno para agregar otro.`);
      return;
    }
    setActiveAttributeIds((previous) => [...previous, attributeId]);
  };

  /** Quita el atributo del producto junto con sus opciones marcadas; la tabla se ajusta sola. */
  const deactivateAttribute = (attributeId: string) => {
    setActiveAttributeIds((previous) => previous.filter((id) => id !== attributeId));
    if (!(attributeId in selectedValues)) return;
    const { [attributeId]: _removed, ...nextSelected } = selectedValues;
    const nextChoices = choicesFrom(nextSelected, attributes);
    const stillPossible = new Set(combinationsOf(nextChoices).map(combinationKey));
    const nextRemoved = new Set([...removed].filter((key) => stillPossible.has(key)));
    setSelectedValues(nextSelected);
    setRemoved(nextRemoved);
    resync(nextChoices, nextRemoved);
  };

  const suggestSkuFromName = () => {
    if (form.getValues('baseSku')) return;
    const suggestion = suggestBaseSku(form.getValues('name'));
    if (suggestion) form.setValue('baseSku', suggestion, { shouldValidate: true });
  };

  const setBulkField = (field: keyof BulkValues, value: string) => setBulk((previous) => ({ ...previous, [field]: value }));
  const applyBulk = () => {
    if (rows.length === 0) return;
    setRows((previous) => applyBulkValues(previous, bulk));
    toast.success(`Valores aplicados a las ${rows.length} variantes.`);
  };

  const updateField = (id: string, field: keyof WizardVariantRow, value: WizardVariantRow[keyof WizardVariantRow]) =>
    setRows((previous) => previous.map((row) => (row.id === id ? { ...row, [field]: value } : row)));

  const pasteCells = (rowIndex: number, column: PasteColumn, text: string) => {
    setRows((previous) => applyPaste(previous, rowIndex, column, text));
    toast.success('Celdas pegadas.');
  };

  const removeRow = (id: string) => {
    const row = rows.find((item) => item.id === id);
    if (!row) return;
    setRemoved((previous) => new Set(previous).add(combinationKey(row.combination)));
    setRows((previous) => previous.filter((item) => item.id !== id));
  };

  const restoreRemoved = () => {
    const none = new Set<string>();
    setRemoved(none);
    resync(choices, none);
  };

  const submit = async () => {
    if (!(await form.trigger(['name', 'baseSku']))) {
      toast.warning('Completa el nombre y el SKU base del producto.');
      return;
    }
    if (rows.length === 0) {
      toast.warning('Marca al menos una opción para generar las variantes.');
      return;
    }
    if (hasBlockingIssues(allIssues)) {
      setAttempted(true);
      toast.error('Corrige las celdas marcadas en rojo antes de guardar.');
      return;
    }
    if (!branchId) {
      toast.warning('Elige una sucursal en la barra superior: el stock inicial se guarda en ella.');
      return;
    }
    setTakenSkus(new Set());
    try {
      await createVariableProduct(toVariableProductRequest(form.getValues(), rows, images.productImages, branchId));
      toast.success('Producto y variantes registrados.');
      onSuccess?.();
    } catch (error) {
      setTakenSkus(new Set(takenSkusOf(error)));
      toast.error(getErrorMessage(error, 'No se pudo guardar el producto.'));
    }
  };

  return {
    form,
    baseSku,
    selectedValues,
    activeAttributeIds,
    activateAttribute,
    deactivateAttribute,
    toggleValue,
    choices,
    combinationCount,
    rows,
    issues,
    blockingMessages,
    removedCount: removed.size,
    takenSkus,
    bulk,
    setBulkField,
    applyBulk,
    images,
    isSubmitting: isCreatingVariable,
    suggestSkuFromName,
    updateField,
    pasteCells,
    removeRow,
    restoreRemoved,
    submit,
  };
}
