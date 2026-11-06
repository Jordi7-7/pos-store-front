import { useState } from 'react';
import type { ProductVM } from '../view-models/product.vm';

/**
 * Productos marcados para imprimir etiquetas. Se guarda el producto entero (no solo el id) para que la
 * selección siga completa al buscar o cambiar de página.
 */
export function useProductSelection() {
  const [selected, setSelected] = useState<Map<string, ProductVM>>(new Map());

  const toggle = (product: ProductVM) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (!next.delete(product.id)) next.set(product.id, product);
      return next;
    });

  const isSelected = (productId: string) => selected.has(productId);

  const allSelected = (page: ProductVM[]) => page.length > 0 && page.every((product) => selected.has(product.id));

  /** Marca todos los de la página, o los desmarca si ya estaban todos marcados. */
  const togglePage = (page: ProductVM[]) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (allSelected(page)) page.forEach((product) => next.delete(product.id));
      else page.forEach((product) => next.set(product.id, product));
      return next;
    });

  return { selected: Array.from(selected.values()), count: selected.size, isSelected, allSelected, toggle, togglePage };
}
