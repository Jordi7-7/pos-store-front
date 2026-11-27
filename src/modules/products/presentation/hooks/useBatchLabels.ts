import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/shared/presentation/formatting/error-messages';
import { labelLinesForArrival, type LabelLine } from '../../domain/rules/product-stock';
import { inventoryRepository } from '../../infrastructure/dependencies';

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Prepara la cola de etiquetas de un lote: pide lo que entró, avisa de lo que no se puede imprimir y abre el diálogo. */
export function useBatchLabels() {
  const [queue, setQueue] = useState<LabelLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Siempre se pide al servidor: el precio puede haber cambiado desde la última vez
  const request = useMutation({
    mutationFn: (batchId: string) => inventoryRepository.batchLabels(batchId),
    onSuccess: ({ lines, unavailable }) => {
      const arrival = labelLinesForArrival(lines);
      if (unavailable > 0) toast.warning(`${plural(unavailable, 'producto eliminado no se imprimirá', 'productos eliminados no se imprimirán')}.`);
      if (arrival.skipped > 0) toast.warning(`${plural(arrival.skipped, 'variante sin SKU no se imprimirá', 'variantes sin SKU no se imprimirán')}: el código de barras sale del SKU.`);
      if (arrival.lines.length === 0) {
        toast.info('Este lote no tiene productos para etiquetar.');
        return;
      }
      setQueue(arrival.lines);
      setIsOpen(true);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudieron preparar las etiquetas del lote.')),
  });

  return {
    queue,
    setQueue,
    isOpen,
    close: () => setIsOpen(false),
    open: (batchId: string) => request.mutate(batchId),
    /** Lote cuyas etiquetas se están pidiendo, para mostrar la espera en su botón. */
    loadingId: request.isPending ? request.variables : null,
  };
}
