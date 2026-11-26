import { useEffect, useState } from 'react';

/** Lo que se espera tras dejar de escribir antes de buscar en el servidor. */
const SEARCH_DELAY_MS = 350;

/**
 * El texto del buscador del listado de productos. Se aplica solo 350 ms después de dejar de escribir, o al instante con
 * Enter (los lectores de códigos de barras lo envían). El texto vive aquí y no en la barra para que «Limpiar filtros»,
 * que está en otra parte de la pantalla, pueda vaciarlo.
 */
export function useProductSearch(search: string, onSearchChange: (search: string) => void, onResetPage: () => void) {
  const [input, setInput] = useState(search);

  useEffect(() => {
    const term = input.trim();
    if (term === search) return;
    const timer = setTimeout(() => {
      onSearchChange(term);
      onResetPage();
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [input, search, onSearchChange, onResetPage]);

  const applyNow = (event: React.FormEvent) => {
    event.preventDefault();
    onSearchChange(input.trim());
    onResetPage();
  };

  /** Un código leído con la cámara: se busca al instante, sin esperar a que se deje de escribir. */
  const applyCode = (code: string) => {
    setInput(code);
    onSearchChange(code);
    onResetPage();
  };

  const clear = () => {
    setInput('');
    onSearchChange('');
  };

  return { input, setInput, applyNow, applyCode, clear };
}
