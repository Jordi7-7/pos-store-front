import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, FileDown, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { downloadVariantsTemplate } from '@/lib/excelTemplates';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBranches } from '../../../branches/presentation/hooks/useBranches';
import type { ImportVariantsReport } from '../../application/ports/products.repository';
import { columnLabelOf, MAX_IMPORT_ROWS, parseImportSheet, type ImportProblem, type ImportRowInput } from '../../domain/rules/variants-import';
import { useVariantImport } from '../hooks/useVariantImport';

interface VariantImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Sucursal elegida en la barra superior: se propone para guardar las existencias. */
  selectedBranchId?: string;
}

const MAX_SHOWN_PROBLEMS = 100;

/**
 * Importación masiva de productos con variantes desde Excel: se sube el archivo, se revisa entero (errores por fila, qué se
 * crearía) y solo al confirmar se guarda, todo o nada.
 */
export const VariantImportModal: React.FC<VariantImportModalProps> = ({ isOpen, onClose, selectedBranchId = '' }) => {
  const { branches = [] } = useBranches();
  const { validate, isValidating, importNow, isImporting, reset } = useVariantImport();
  const fileInput = useRef<HTMLInputElement>(null);

  const [branchId, setBranchId] = useState(selectedBranchId);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ImportRowInput[]>([]);
  const [sheetProblems, setSheetProblems] = useState<ImportProblem[]>([]);
  const [report, setReport] = useState<ImportVariantsReport | null>(null);

  const clear = () => {
    setFileName('');
    setRows([]);
    setSheetProblems([]);
    setReport(null);
    reset();
    if (fileInput.current) fileInput.current.value = '';
  };
  const close = () => {
    clear();
    onClose();
  };

  /** Valida el archivo con el servidor (sin guardar) con la sucursal indicada. */
  const check = async (importRows: ImportRowInput[], branch: string) => {
    try {
      setReport(await validate({ branchId: branch || undefined, rows: importRows }));
    } catch (error) {
      setReport(null);
      toast.error(getErrorMessage(error, 'No se pudo revisar el archivo.'));
    }
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    clear();
    setFileName(file.name);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
      if (!sheet) throw new Error('El archivo no tiene hojas.');
      const parsed = parseImportSheet(XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' }));

      if (parsed.missingColumns.length > 0) {
        toast.error(`Al archivo le faltan estas columnas: ${parsed.missingColumns.join(', ')}. Usa la plantilla.`);
        setFileName('');
        return;
      }
      if (parsed.rows.length === 0) {
        toast.error('El archivo no tiene filas con datos.');
        setFileName('');
        return;
      }
      if (parsed.rows.length > MAX_IMPORT_ROWS) {
        toast.error(`El archivo tiene ${parsed.rows.length} filas; el máximo por importación es ${MAX_IMPORT_ROWS}. Divídelo en varios.`);
        setFileName('');
        return;
      }
      setRows(parsed.rows);
      setSheetProblems(parsed.problems);
      await check(parsed.rows, branchId);
    } catch {
      toast.error('No se pudo leer el archivo. Comprueba que es un Excel (.xlsx o .xls) con el formato de la plantilla.');
      setFileName('');
    }
  };

  const changeBranch = (next: string) => {
    setBranchId(next);
    if (rows.length > 0) void check(rows, next);
  };

  const confirm = async () => {
    try {
      const result = await importNow({ branchId: branchId || undefined, rows });
      toast.success(`Se importaron ${result.summary.products} productos con ${result.summary.variants} variantes.`);
      close();
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo importar el archivo.'));
    }
  };

  const problems = [
    ...sheetProblems.map((problem) => ({ row: problem.row, column: problem.column, message: problem.message })),
    ...(report?.errors ?? []).map((error) => ({ row: error.row, column: columnLabelOf(error.field), message: error.message })),
  ].sort((a, b) => a.row - b.row);
  const canImport = report?.valid === true && sheetProblems.length === 0 && !isImporting && !isValidating;
  const summary = report?.summary;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar productos con variantes desde Excel
          </DialogTitle>
          <DialogDescription className="text-xs">Una fila por variante. Se revisa todo el archivo antes de guardar; si algo falla, no se guarda nada.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Descarga la plantilla: trae ejemplos de un producto con tallas y colores y de uno simple, y una hoja con las instrucciones.
            </p>
            <Button type="button" variant="outline" size="sm" onClick={downloadVariantsTemplate} className="shrink-0 cursor-pointer gap-1.5 text-xs font-semibold">
              <FileDown className="h-4 w-4" />
              Descargar plantilla
            </Button>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="variant-import-branch" className="block text-xs font-bold text-muted-foreground">
              Sucursal para las existencias
            </label>
            <select
              id="variant-import-branch"
              value={branchId}
              onChange={(event) => changeBranch(event.target.value)}
              className="w-full max-w-md rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Ninguna (solo si todas las existencias van en 0)</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={isValidating || isImporting}
            className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/10 p-8 transition-colors hover:border-primary/50 hover:bg-muted/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <input ref={fileInput} type="file" accept=".xlsx,.xls" onChange={handleFile} className="hidden" aria-label="Archivo de Excel" />
            {isValidating ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Upload className="h-6 w-6 text-primary" />}
            <span className="text-xs font-bold text-secondary">{fileName || 'Elige tu archivo de Excel'}</span>
            <span className="text-xs text-muted-foreground">{isValidating ? 'Revisando el archivo…' : '.xlsx o .xls, hasta 2000 filas'}</span>
          </button>

          {report && summary && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className="font-mono">{summary.products} productos</Badge>
                <Badge variant="outline" className="font-mono">{summary.variants} variantes</Badge>
                <Badge variant="outline" className="font-mono">{summary.units} unidades</Badge>
                {summary.newCategories.length > 0 && <Badge variant="secondary">Categorías nuevas: {summary.newCategories.join(', ')}</Badge>}
                {summary.newAttributes.length > 0 && <Badge variant="secondary">Atributos nuevos: {summary.newAttributes.join(', ')}</Badge>}
                {summary.newAttributeValues > 0 && <Badge variant="secondary">{summary.newAttributeValues} opciones nuevas</Badge>}
              </div>

              {problems.length === 0 ? (
                <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  El archivo está bien. Al importar se crearán {summary.products} productos con {summary.variants} variantes.
                </div>
              ) : (
                <div role="alert" className="overflow-hidden rounded-xl border border-destructive/30">
                  <div className="flex items-center gap-2 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {problems.length} {problems.length === 1 ? 'problema' : 'problemas'} por corregir en el Excel
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-muted/90 font-semibold text-muted-foreground">
                        <tr>
                          <th className="w-16 px-3 py-1.5">Fila</th>
                          <th className="w-40 px-3 py-1.5">Columna</th>
                          <th className="px-3 py-1.5">Problema</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {problems.slice(0, MAX_SHOWN_PROBLEMS).map((problem) => (
                          <tr key={`${problem.row}-${problem.column}-${problem.message}`}>
                            <td className="px-3 py-1.5 font-mono">{problem.row}</td>
                            <td className="px-3 py-1.5">{problem.column}</td>
                            <td className="px-3 py-1.5">{problem.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {problems.length > MAX_SHOWN_PROBLEMS && <p className="px-3 py-2 text-xs text-muted-foreground">…y {problems.length - MAX_SHOWN_PROBLEMS} más. Corrige estos y vuelve a subir el archivo.</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
            <Button type="button" variant="outline" onClick={close} disabled={isImporting} className="cursor-pointer text-xs font-semibold">
              Cancelar
            </Button>
            <Button type="button" onClick={confirm} disabled={!canImport} className="cursor-pointer gap-1.5 text-xs font-bold">
              {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
              {summary && report?.valid ? `Importar ${summary.products} productos` : 'Importar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
