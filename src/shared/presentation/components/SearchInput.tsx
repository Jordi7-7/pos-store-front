import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps extends Omit<React.ComponentProps<'input'>, 'onChange' | 'value'> {
  value: string;
  onValueChange: (value: string) => void;
  /** Ancho del campo; por defecto el mismo en todas las pantallas. */
  className?: string;
}

/** Campo de búsqueda común: misma altura, icono y estilo en listados, historiales y directorios. */
export const SearchInput: React.FC<SearchInputProps> = ({ value, onValueChange, className, ...props }) => (
  <div className={cn('relative w-full sm:w-72', className)}>
    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input type="search" value={value} onChange={(event) => onValueChange(event.target.value)} className="pl-9" {...props} />
  </div>
);
