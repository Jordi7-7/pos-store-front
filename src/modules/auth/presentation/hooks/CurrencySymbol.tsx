import { useCurrencySymbol } from './useCurrencySymbol';

/** El símbolo de la moneda de la tienda como texto dentro de una etiqueta: `Venta (<CurrencySymbol />)`. */
export function CurrencySymbol() {
  return <>{useCurrencySymbol()}</>;
}
