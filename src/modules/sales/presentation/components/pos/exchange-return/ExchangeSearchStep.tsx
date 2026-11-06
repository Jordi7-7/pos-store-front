import React from 'react';
import { Search, Loader2 } from 'lucide-react';

interface ExchangeSearchStepProps {
  invoiceInput: string;
  onChangeInvoiceInput: (val: string) => void;
  onSearch: () => void;
  isSearching: boolean;
}

export const ExchangeSearchStep: React.FC<ExchangeSearchStepProps> = ({
  invoiceInput,
  onChangeInvoiceInput,
  onSearch,
  isSearching,
}) => {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <p className="text-xs text-muted-foreground">
        Ingresa el número de folio de la venta original para ver las prendas disponibles para devolución o cambio.
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            autoFocus
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-muted border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Ej: 001-001-000000005"
            value={invoiceInput}
            onChange={(e) => onChangeInvoiceInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
        <button
          onClick={onSearch}
          disabled={isSearching || !invoiceInput.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-all hover:bg-primary/90 active:scale-95 cursor-pointer"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Buscar
        </button>
      </div>
    </div>
  );
};
