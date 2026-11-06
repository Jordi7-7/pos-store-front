import { useRef, useState } from 'react';
import type React from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import { isPurchaseTemplate, mergeImportErrors, normalizePurchaseRows, rowLimitMessage, type SheetItem } from '../../domain/rules/purchase-sheet';
import { usePurchaseImport } from './usePurchaseImport';

interface Options {
  branchId?: string;
  supplierId: string;
  invoiceNumber: string;
  onImported: () => void;
}

/** Cabeceras de la primera fila de la hoja, para comprobar que es la plantilla correcta. */
function readHeaders(sheet: XLSX.WorkSheet): string[] {
  const range = XLSX.utils.decode_range(sheet['!ref'] || '');
  const headers: string[] = [];
  for (let column = range.s.c; column <= range.e.c; ++column) {
    const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: column })];
    if (cell && cell.t) headers.push(String(cell.v));
  }
  return headers;
}

/** Flujo del ingreso masivo: leer el Excel, validar los SKU en el servidor y confirmar. Las reglas viven en `purchase-sheet`. */
export function usePurchaseSheetImport({ branchId, supplierId, invoiceNumber, onImported }: Options) {
  const [items, setItems] = useState<SheetItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const { validateImport, importPurchases, isImporting, resetValidation } = usePurchaseImport({
    onImportSuccess: () => {
      toast.success('¡Ingreso masivo registrado con éxito en Kardex y stock actualizado!');
      reset();
      onImported();
    },
    onImportError: (err) => toast.error(getErrorMessage(err, 'Error al procesar la carga masiva.')),
  });

  const reset = () => {
    setItems([]);
    setErrors({});
    setNames({});
    setFileName('');
    setGlobalError(null);
    setIsValidated(false);
    setIsValidating(false);
    resetValidation();
    clearFileInput();
  };

  const processWorkbook = (binary: string | ArrayBuffer | null | undefined) => {
    try {
      const workbook = XLSX.read(binary, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
      if (!sheet) throw new Error('El archivo no contiene hojas de cálculo.');

      if (!isPurchaseTemplate(readHeaders(sheet))) {
        toast.error('Plantilla incorrecta. Para el ingreso de existencias usa la plantilla correcta que tiene únicamente las columnas: SKU y Cantidad.');
        setIsValidating(false);
        setFileName('');
        clearFileInput();
        return;
      }

      const parsed = normalizePurchaseRows(XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet));
      if (parsed.length === 0) {
        toast.error('El archivo Excel no tiene registros válidos o está vacío.');
        setIsValidating(false);
        return;
      }
      setItems(parsed);

      const limitMessage = rowLimitMessage(parsed.length);
      if (limitMessage) {
        setGlobalError(limitMessage);
        setIsValidated(false);
        setIsValidating(false);
        toast.error(limitMessage);
        return;
      }

      setGlobalError(null);
      setIsValidated(false);
      validateImport(parsed, {
        onSuccess: (data) => {
          setErrors(mergeImportErrors(parsed, data.errors));
          setNames(data.names);
          setIsValidated(true);
          setIsValidating(false);
        },
        onError: (err) => {
          const message = getErrorMessage(err, 'Error al validar el archivo de ingresos.');
          setIsValidating(false);
          setIsValidated(false);
          setGlobalError(message);
          toast.error(message);
        },
      });
    } catch {
      toast.error('Error al parsear el archivo Excel. Revisa las columnas SKU y Cantidad.');
      setIsValidating(false);
      setIsValidated(false);
    }
  };

  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!branchId) {
      toast.warning('Por favor selecciona una sucursal destino antes de subir el archivo.');
      clearFileInput();
      return;
    }
    setFileName(file.name);
    setIsValidating(true);
    const reader = new FileReader();
    reader.onload = (loaded) => processWorkbook(loaded.target?.result);
    reader.readAsBinaryString(file);
  };

  const pickFile = () => {
    if (!branchId) {
      toast.warning('Por favor, selecciona primero la sucursal de destino.');
      return;
    }
    fileInputRef.current?.click();
  };

  const confirm = () => {
    if (items.length === 0 || !branchId) return;
    importPurchases({ branchId, supplierId: supplierId || undefined, items, invoiceNumber: invoiceNumber.trim() || undefined });
  };

  const errorCount = Object.keys(errors).length;
  const canConfirm = isValidated && errorCount === 0 && !globalError && !isImporting && !isValidating;

  return { items, errors, names, errorCount, fileName, globalError, isValidating, isValidated, isImporting, canConfirm, fileInputRef, onFileSelected, pickFile, confirm, reset };
}
