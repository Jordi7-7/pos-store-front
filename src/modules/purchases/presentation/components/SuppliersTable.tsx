import React from 'react';
import { Edit, Mail, MapPin, Phone, Trash2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { SupplierEntity } from '../../domain/entities/supplier.entity';

interface SuppliersTableProps {
  suppliers: SupplierEntity[];
  onEdit: (supplier: SupplierEntity) => void;
  onDelete: (supplier: SupplierEntity) => void;
}

/** Directorio de proveedores: una fila por proveedor con sus datos de contacto y las acciones de editar y eliminar. */
export const SuppliersTable: React.FC<SuppliersTableProps> = ({ suppliers, onEdit, onDelete }) => (
            <div className="overflow-x-auto rounded-b-xl border-t border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="font-semibold text-xs">RUC / Identificación</TableHead>
                    <TableHead className="font-semibold text-xs">Razón Social</TableHead>
                    <TableHead className="font-semibold text-xs">Teléfono</TableHead>
                    <TableHead className="font-semibold text-xs">Correo Electrónico</TableHead>
                    <TableHead className="font-semibold text-xs">Dirección</TableHead>
                    <TableHead className="w-[90px] text-center font-semibold text-xs">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((sup) => (
                    <TableRow key={sup.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
                      {/* Avatar / Icon */}
                      <TableCell className="py-2.5 pl-4 pr-1">
                        <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0 font-bold text-xs uppercase">
                          {sup.name ? sup.name.charAt(0) : <Truck className="w-4 h-4" />}
                        </div>
                      </TableCell>

                      {/* ID / RUC */}
                      <TableCell className="py-2.5 font-mono text-[11px] font-bold text-primary">
                        {sup.identityNumber}
                      </TableCell>

                      {/* Name */}
                      <TableCell className="py-2.5">
                        <div className="font-semibold text-xs text-foreground leading-tight" title={sup.name}>
                          {sup.name}
                        </div>
                      </TableCell>

                      {/* Phone */}
                      <TableCell className="py-2.5 font-mono text-xs text-foreground/90">
                        {sup.phone ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            {sup.phone}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Email */}
                      <TableCell className="py-2.5 text-xs text-foreground/90">
                        {sup.email ? (
                          <span className="inline-flex items-center gap-1.5 truncate max-w-[200px]" title={sup.email}>
                            <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{sup.email}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50 text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Address */}
                      <TableCell className="py-2.5 text-xs text-foreground/90">
                        {sup.address ? (
                          <span className="inline-flex items-center gap-1.5 truncate max-w-[200px]" title={sup.address}>
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{sup.address}</span>
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
                            onClick={() => onEdit(sup)}
                            title="Editar Proveedor"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(sup)}
                            title="Eliminar Proveedor"
                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
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
