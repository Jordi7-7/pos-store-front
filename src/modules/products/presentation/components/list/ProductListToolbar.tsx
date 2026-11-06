import React, { useState } from 'react';
import { Barcode, Layers, Package, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductType } from '../../../domain/enums';

interface ProductListToolbarProps {
  search: string;
  onSearchChange: (search: string) => void;
  onResetPage: () => void;
  productType?: ProductType;
  onProductTypeChange?: (type?: ProductType) => void;
  inStockOnly?: boolean;
  onInStockOnlyChange?: (inStockOnly: boolean) => void;
  canPrint: boolean;
  selectedCount: number;
  onPrintSelected: () => void;
}

/** Barra de la lista: impresión masiva, filtros por tipo y existencias, y búsqueda. */
export const ProductListToolbar: React.FC<ProductListToolbarProps> = ({ search, onSearchChange, onResetPage, productType, onProductTypeChange, inStockOnly, onInStockOnlyChange, canPrint, selectedCount, onPrintSelected }) => {
  const [searchInput, setSearchInput] = useState(search);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput.trim());
    onResetPage();
  };

  const handleClearSearch = () => {
    setSearchInput('');
    onSearchChange('');
    onResetPage();
  };

  return (
  <div className="flex flex-wrap items-center gap-2 w-full">
    {/* Botón de impresión masiva cuando hay seleccionados */}
    {canPrint && selectedCount > 0 && (
      <Button
        type="button"
        size="sm"
        onClick={onPrintSelected}
        className="text-xs h-9 gap-1.5 font-bold bg-primary text-white shadow-sm cursor-pointer animate-fade-in"
      >
        <Barcode className="w-4 h-4" />
        Imprimir Etiquetas ({selectedCount})
      </Button>
    )}

    {/* Filtro por tipo de producto (Todos / Simples / Con Variantes) */}
    {onProductTypeChange && (
      <div className="flex h-9 items-center rounded-lg border border-border-card bg-muted/60 p-0.5">
        <button
          type="button"
          onClick={() => onProductTypeChange(undefined)}
          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
            productType === undefined
              ? 'bg-background text-foreground shadow-2xs'
              : 'text-neutral hover:text-foreground'
          }`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => onProductTypeChange(ProductType.SIMPLE)}
          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            productType === ProductType.SIMPLE
              ? 'bg-background text-foreground shadow-2xs'
              : 'text-neutral hover:text-foreground'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-neutral" />
          <span>Simples</span>
        </button>
        <button
          type="button"
          onClick={() => onProductTypeChange(ProductType.VARIABLE)}
          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            productType === ProductType.VARIABLE
              ? 'bg-background text-primary shadow-2xs font-bold'
              : 'text-neutral hover:text-foreground'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span>Con Variantes</span>
        </button>
      </div>
    )}

    {/* Solo con existencias: casilla compacta, no un botón grande */}
    {onInStockOnlyChange && (
      <label
        className="inline-flex h-9 cursor-pointer select-none items-center gap-2 rounded-lg border border-border-card bg-card px-3 text-[13px] font-medium text-secondary transition-colors hover:bg-muted/50 has-[:checked]:border-primary/40 has-[:checked]:bg-muted/40"
        title="Ocultar los productos sin existencias"
      >
        <input type="checkbox" checked={Boolean(inStockOnly)} onChange={(e) => onInStockOnlyChange(e.target.checked)} className="h-4 w-4 cursor-pointer accent-primary" />
        Solo con stock
      </label>
    )}

    <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-1 min-w-[260px]">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Buscar por nombre, SKU o código de barras..."
          className="pl-9 pr-8 text-xs h-9"
        />
        {searchInput && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-2 text-xs text-muted-foreground hover:text-foreground font-bold"
          >
            ×
          </button>
        )}
      </div>
      <Button type="submit" size="sm" className="text-xs h-9">
        Buscar
      </Button>
    </form>
  </div>
  );
};
