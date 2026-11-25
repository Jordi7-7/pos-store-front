import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

interface NumberCellProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> {
  value: number | null;
  /** `null` = la celda está vacía (solo el precio de mayoreo admite vacío; en los demás cuenta como 0). */
  onValueChange: (value: number | null) => void;
}

const toText = (value: number | null) => (value === null ? '' : String(value));
const parse = (text: string): number | null => {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
};

/**
 * Celda numérica de la tabla de variantes. Guarda lo que se teclea como texto mientras se escribe (se puede borrar todo,
 * dejar «1.» a medias o escribir una coma) y solo avisa al padre del número ya válido.
 */
export const NumberCell: React.FC<NumberCellProps> = ({ value, onValueChange, ...inputProps }) => {
  const [text, setText] = useState(toText(value));

  useEffect(() => {
    // Si el valor cambió desde fuera (pegar, aplicar en bloque), la celda lo refleja; si es el mismo número que ya se ve, se respeta el texto
    if (parse(text) !== value) setText(toText(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Input
      {...inputProps}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        onValueChange(parse(event.target.value));
      }}
    />
  );
};
