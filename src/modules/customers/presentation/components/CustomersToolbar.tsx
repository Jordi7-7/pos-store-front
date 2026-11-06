import React from 'react';
import { Plus } from 'lucide-react';
import { CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/shared/presentation/components/SearchInput';

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
    <CardHeader className="border-b border-border-card pb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{totalCount} {totalCount === 1 ? 'cliente' : 'clientes'}</p>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <SearchInput value={searchTerm} onValueChange={onSearchChange} placeholder="Buscar por nombre o cédula…" aria-label="Buscar cliente" />

          <Button onClick={onOpenCreate}>
            <Plus />
            Nuevo cliente
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};
