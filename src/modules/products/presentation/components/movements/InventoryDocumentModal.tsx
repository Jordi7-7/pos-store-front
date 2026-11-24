import React from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import { InventoryDocumentKind, InventoryMovementType } from '../../../domain/enums';
import { useInventoryDocument } from '../../hooks';

interface InventoryDocumentModalProps {
  /** `null` = cerrada. */
  documentId: string | null;
  onClose: () => void;
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
    <dd className="mt-0.5 text-sm text-foreground">{children}</dd>
  </div>
);

/** Un documento de inventario abierto desde el historial: quién lo hizo, cuándo, por qué, el comentario y todas sus líneas. */
export const InventoryDocumentModal: React.FC<InventoryDocumentModalProps> = ({ documentId, onClose }) => {
  const { document, isLoading, isError, error } = useInventoryDocument(documentId);

  return (
    <Dialog open={documentId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-border bg-muted/25 px-6 py-4 pr-14">
          <DialogTitle className="font-mono text-base font-semibold">{document?.number ?? 'Documento de inventario'}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-xs text-neutral">
            <Loader2 className="h-5 w-5 animate-spin text-primary" /> Cargando documento…
          </div>
        ) : isError || !document ? (
          <p className="px-6 py-12 text-center text-xs text-destructive">{getErrorMessage(error, 'No se pudo cargar el documento.')}</p>
        ) : (
          <div className="min-h-0 space-y-5 overflow-y-auto px-6 py-5">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Tipo">{document.kindLabel}</Field>
              <Field label="Fecha y hora">{document.dateFormatted}</Field>
              {document.reasonLabel && <Field label="Motivo">{document.reasonLabel}</Field>}
              <Field label="Registrado por">{document.userName ?? '—'}</Field>
              <Field label={document.kind === InventoryDocumentKind.TRANSFER ? 'Sucursal de origen' : 'Sucursal'}>{document.branchName}</Field>
              {document.destinationBranchName && <Field label="Sucursal de destino">{document.destinationBranchName}</Field>}
              <div className="sm:col-span-2">
                <Field label="Comentario">{document.comment ?? <span className="text-muted-foreground">Sin comentario</span>}</Field>
              </div>
            </dl>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground">
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Sucursal</th>
                    <th className="px-4 py-3 text-right">Cantidad</th>
                    <th className="px-4 py-3 text-right">Costo unitario</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {document.lines.map((line) => {
                    const isEntry = line.type === InventoryMovementType.IN;
                    return (
                      <tr key={`${line.variantId}-${line.type}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{line.productName}</div>
                          <div className="font-mono text-muted-foreground">{line.sku}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={isEntry ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600' : 'border-rose-500/30 bg-rose-500/5 text-rose-600'}>
                            {isEntry ? 'Entrada' : 'Salida'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-foreground">{line.branchName ?? '—'}</td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${isEntry ? 'text-emerald-600' : 'text-destructive'}`}>{line.signedQuantity}</td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">{line.unitCostText}</td>
                        <td className="px-4 py-3 text-right font-mono text-muted-foreground">{line.balanceText}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              {document.productsText} · {document.unitsText}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
