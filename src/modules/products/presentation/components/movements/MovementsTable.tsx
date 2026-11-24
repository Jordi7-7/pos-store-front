import React from 'react';
import { Badge } from '@/components/ui/badge';
import { InventoryMovementType } from '../../../domain/enums';
import type { InventoryMovementHistoryVM } from '../../view-models/inventory.vm';

interface MovementsTableProps {
  movements: readonly InventoryMovementHistoryVM[];
  /** Abre el documento al que pertenece el movimiento. */
  onOpenDocument: (documentId: string) => void;
}

/** Tabla del historial: fecha, tipo, producto, cantidad con signo, saldo tras el movimiento, sucursal y motivo. */
export const MovementsTable: React.FC<MovementsTableProps> = ({ movements, onOpenDocument }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs text-left border-collapse">
      <thead>
        <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground">
          <th className="px-4 py-3">Fecha y hora</th>
          <th className="px-4 py-3">Tipo</th>
          <th className="px-4 py-3">Producto</th>
          <th className="px-4 py-3 text-right">Cantidad</th>
          <th className="px-4 py-3 text-right">Saldo</th>
          <th className="px-4 py-3">Sucursal</th>
          <th className="px-4 py-3">Motivo</th>
          <th className="px-4 py-3">Documento</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {movements.map((movement) => {
          const isEntry = movement.type === InventoryMovementType.IN;
          const documentRef = movement.document;
          return (
            <tr key={movement.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">{movement.dateFormatted}</td>
              <td className="px-4 py-3">
                <Badge variant="outline" className={isEntry ? 'text-emerald-600 border-emerald-500/30 bg-emerald-500/5' : 'text-rose-600 border-rose-500/30 bg-rose-500/5'}>
                  {isEntry ? 'Entrada' : 'Salida'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-foreground">{movement.productName}</div>
                <div className="font-mono text-muted-foreground">{movement.sku}</div>
              </td>
              <td className={`px-4 py-3 text-right font-mono font-bold ${isEntry ? 'text-emerald-600' : 'text-destructive'}`}>{movement.signedQuantity}</td>
              <td className="px-4 py-3 text-right font-mono text-muted-foreground" title="Existencia de la sucursal tras este movimiento">{movement.balanceText}</td>
              <td className="px-4 py-3 text-foreground">
                <div>{movement.branchName}</div>
                {movement.counterpartText && <div className="text-muted-foreground">{movement.counterpartText}</div>}
              </td>
              <td className="px-4 py-3 text-foreground">
                <div>{movement.reasonLabel}</div>
                {movement.comment && <div className="max-w-[260px] truncate text-muted-foreground" title={movement.comment}>{movement.comment}</div>}
              </td>
              <td className="px-4 py-3">
                {documentRef ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenDocument(documentRef.id)}
                      title="Abrir el documento con todas sus líneas"
                      className="font-mono text-primary underline-offset-2 hover:underline focus-visible:underline"
                    >
                      {documentRef.number}
                    </button>
                    {movement.authorName && <div className="text-muted-foreground">{movement.authorName}</div>}
                  </>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);
