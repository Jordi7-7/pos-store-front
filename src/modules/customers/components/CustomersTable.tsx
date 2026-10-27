import React from 'react';
import { 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  User, 
  Loader2, 
  Users 
} from 'lucide-react';
import type { CustomerEntity } from '../entities/customer.entity';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CustomersTableProps {
  customers: CustomerEntity[];
  isLoading: boolean;
  searchTerm: string;
  onClearSearch: () => void;
  onEdit: (customer: CustomerEntity) => void;
  onDelete: (customer: CustomerEntity) => void;
}

export const CustomersTable: React.FC<CustomersTableProps> = ({
  customers,
  isLoading,
  searchTerm,
  onClearSearch,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs text-muted-foreground">Cargando directorio de clientes...</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
        <Users className="w-10 h-10 text-muted-foreground opacity-40" />
        <p className="text-sm text-muted-foreground">No se encontraron clientes registrados.</p>
        {searchTerm && (
          <Button variant="link" size="sm" onClick={onClearSearch} className="text-xs">
            Limpiar búsqueda
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-b-xl border-t border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[50px]"></TableHead>
            <TableHead className="font-semibold text-xs">Cédula / RUC</TableHead>
            <TableHead className="font-semibold text-xs">Cliente</TableHead>
            <TableHead className="font-semibold text-xs">Teléfono</TableHead>
            <TableHead className="font-semibold text-xs">Correo Electrónico</TableHead>
            <TableHead className="w-[90px] text-center font-semibold text-xs">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((c) => (
            <TableRow 
              key={c.id} 
              className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors"
            >
              {/* Avatar / Initials */}
              <TableCell className="py-2.5 pl-4 pr-1">
                <div 
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 font-bold text-xs uppercase ${
                    c.isFinalConsumer 
                      ? 'bg-primary/10 border-primary/20 text-primary' 
                      : 'bg-muted border-border text-muted-foreground'
                  }`}
                >
                  {c.initials || <User className="w-4 h-4" />}
                </div>
              </TableCell>

              {/* ID / Cédula */}
              <TableCell className="py-2.5 font-mono text-[11px] font-bold text-primary">
                {c.identityNumber}
              </TableCell>

              {/* Name */}
              <TableCell className="py-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-foreground leading-tight" title={c.name}>
                    {c.name}
                  </span>
                  {c.isFinalConsumer && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                      Consumidor Final
                    </span>
                  )}
                </div>
              </TableCell>

              {/* Phone */}
              <TableCell className="py-2.5 font-mono text-xs text-foreground/90">
                {c.phone ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    {c.phone}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50 text-xs">—</span>
                )}
              </TableCell>

              {/* Email */}
              <TableCell className="py-2.5 text-xs text-foreground/90">
                {c.email ? (
                  <span className="inline-flex items-center gap-1.5 truncate max-w-[260px]" title={c.email}>
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground/50 text-xs">—</span>
                )}
              </TableCell>

              {/* Actions */}
              <TableCell className="py-2.5 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(c)}
                    title="Editar Cliente"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(c)}
                    title="Eliminar Cliente"
                    disabled={c.isFinalConsumer}
                    className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
