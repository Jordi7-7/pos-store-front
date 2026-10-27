import React from 'react';
import { Search, Plus, Users } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CustomersToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  totalCount: number;
  onOpenCreate: () => void;
}

export const CustomersToolbar: React.FC<CustomersToolbarProps> = ({
  searchTerm,
  onSearchChange,
  totalCount,
  onOpenCreate,
}) => {
  return (
    <CardHeader className="border-b border-border/60 pb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Directorio de Clientes ({totalCount})
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Administra y organiza el registro de tus clientes frecuentes para ventas y reportes.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o cédula..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs text-secondary placeholder:text-neutral/60 focus:outline-none focus:border-primary/50"
            />
          </div>

          <Button
            onClick={onOpenCreate}
            size="sm"
            className="flex items-center gap-1.5 text-xs font-semibold h-8 rounded-xl shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo Cliente
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};
