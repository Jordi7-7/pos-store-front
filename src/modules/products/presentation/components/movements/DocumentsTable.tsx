import React from 'react';
import { Badge } from '@/components/ui/badge';
import { InventoryDocumentKind } from '../../../domain/enums';
import type { InventoryDocumentListItemVM } from '../../view-models/inventory.vm';

interface DocumentsTableProps {
  documents: readonly InventoryDocumentListItemVM[];
  /** Abre el documento con todas sus líneas. */
  onOpenDocument: (documentId: string) => void;
}

/** Etiquetas cortas para la tabla (la ventana del documento usa las largas): el tipo cabe en una línea. */
const KIND_SHORT_LABEL: Record<InventoryDocumentKind, string> = {
  [InventoryDocumentKind.ENTRY]: 'Entrada',
  [InventoryDocumentKind.EXIT]: 'Salida',
  [InventoryDocumentKind.COUNT]: 'Conteo',
  [InventoryDocumentKind.TRANSFER]: 'Traslado',
};

const KIND_STYLE: Record<InventoryDocumentKind, string> = {
  [InventoryDocumentKind.ENTRY]: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600',
  [InventoryDocumentKind.EXIT]: 'border-rose-500/30 bg-rose-500/5 text-rose-600',
  [InventoryDocumentKind.COUNT]: 'border-sky-500/30 bg-sky-500/5 text-sky-600',
  [InventoryDocumentKind.TRANSFER]: 'border-violet-500/30 bg-violet-500/5 text-violet-600',
};

/** Tabla de documentos: uno por fila, con su tipo, sucursal, motivo y comentario, quién lo registró y cuánto movió. Clic para abrirlo. */
export const DocumentsTable: React.FC<DocumentsTableProps> = ({ documents, onOpenDocument }) => (
  <div className="overflow-x-auto">
    <table className="w-full border-collapse text-left text-xs">
      <thead>
        <tr className="border-b border-border bg-muted/40 font-bold text-muted-foreground">
          <th className="px-4 py-3">Documento</th>
          <th className="px-4 py-3">Tipo</th>
          <th className="px-4 py-3">Fecha y hora</th>
          <th className="px-4 py-3">Sucursal</th>
          <th className="px-4 py-3">Motivo</th>
          <th className="px-4 py-3">Registrado por</th>
          <th className="px-4 py-3 text-right">Productos</th>
          <th className="px-4 py-3 text-right">Unidades</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {documents.map((document) => (
          <tr key={document.id} onClick={() => onOpenDocument(document.id)} className="cursor-pointer transition-colors hover:bg-muted/20">
            <td className="px-4 py-3">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenDocument(document.id);
                }}
                title="Abrir el documento con todas sus líneas"
                className="whitespace-nowrap font-mono text-primary underline-offset-2 hover:underline focus-visible:underline"
              >
                {document.number}
              </button>
            </td>
            <td className="px-4 py-3">
              <Badge variant="outline" className={KIND_STYLE[document.kind]}>
                {KIND_SHORT_LABEL[document.kind]}
              </Badge>
            </td>
            <td className="whitespace-nowrap px-4 py-3 font-mono text-muted-foreground">{document.dateFormatted}</td>
            <td className="whitespace-nowrap px-4 py-3 text-foreground">{document.branchText}</td>
            <td className="px-4 py-3 text-foreground">
              {document.reasonLabel && <div>{document.reasonLabel}</div>}
              {document.comment ? (
                <div className="max-w-[260px] truncate text-muted-foreground" title={document.comment}>
                  {document.comment}
                </div>
              ) : (
                !document.reasonLabel && <span className="text-muted-foreground">—</span>
              )}
            </td>
            <td className="whitespace-nowrap px-4 py-3 text-foreground">{document.userName ?? '—'}</td>
            <td className="px-4 py-3 text-right font-mono">{document.productsText}</td>
            <td className="px-4 py-3 text-right font-mono font-bold">{document.unitsText}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
