import React from 'react';
import { ChevronDown, Layers, Package } from 'lucide-react';
import { ScanButton } from '@/shared/presentation/components/ScanButton';
import { SearchInput } from '@/shared/presentation/components/SearchInput';
import { ProductType, StockStatus, StockStatusLabels } from '../../../domain/enums';

interface ProductListToolbarProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: (event: React.FormEvent) => void;
  /** Un código leído con la cámara: se busca al instante. */
  onScan?: (code: string) => void;
  onResetPage: () => void;
  productType?: ProductType;
  onProductTypeChange?: (type?: ProductType) => void;
  stockStatus?: StockStatus;
  onStockStatusChange?: (status?: StockStatus) => void;
}

const TYPE_OPTIONS = [
  { value: undefined, label: 'Todos', Icon: null },
  { value: ProductType.SIMPLE, label: 'Simples', Icon: Package },
  { value: ProductType.VARIABLE, label: 'Con variantes', Icon: Layers },
] as const;

/**
 * Barra de la lista de productos: búsqueda y filtros (existencias y tipo) en una fila que se parte si no cabe. Las acciones que
 * dependen del contexto (limpiar filtros, imprimir lo seleccionado) están en la franja de la tarjeta, junto al contador.
 */
export const ProductListToolbar: React.FC<ProductListToolbarProps> = ({ searchInput, onSearchInputChange, onSearchSubmit, onScan, onResetPage, productType, onProductTypeChange, stockStatus, onStockStatusChange }) => (
  <div className="flex flex-wrap items-center gap-3">
    <form onSubmit={onSearchSubmit} className="flex w-full items-center gap-2 sm:w-auto sm:min-w-[320px] sm:max-w-md sm:flex-1">
      <SearchInput value={searchInput} onValueChange={onSearchInputChange} placeholder="Buscar por nombre, SKU o código de barras…" aria-label="Buscar producto" className="sm:w-full" />
      {onScan && <ScanButton title="Escanear un producto" onDetected={onScan} />}
    </form>

    {onStockStatusChange && (
      <div className="relative">
        <select
          aria-label="Existencias"
          title="Filtrar por existencias"
          value={stockStatus ?? ''}
          onChange={(event) => {
            onStockStatusChange(Object.values(StockStatus).find((status) => status === event.target.value));
            onResetPage();
          }}
          className={`h-9 cursor-pointer appearance-none rounded-lg border bg-card pl-3 pr-9 text-sm text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${stockStatus ? 'border-primary/40 bg-muted/40 font-medium' : 'border-border-card'}`}
        >
          <option value="">Todas las existencias</option>
          {Object.values(StockStatus).map((status) => (
            <option key={status} value={status}>
              {StockStatusLabels[status]}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    )}

    {onProductTypeChange && (
      <div role="group" aria-label="Tipo de producto" className="flex h-9 items-center gap-0.5 rounded-lg border border-border-card bg-muted/60 p-0.5">
        {TYPE_OPTIONS.map(({ value, label, Icon }) => {
          const active = productType === value;
          return (
            <button
              key={label}
              type="button"
              aria-pressed={active}
              onClick={() => {
                onProductTypeChange(value);
                onResetPage();
              }}
              className={`flex h-full cursor-pointer items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${active ? 'bg-background text-foreground shadow-2xs' : 'text-neutral hover:text-foreground'}`}
            >
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {label}
            </button>
          );
        })}
      </div>
    )}
  </div>
);
