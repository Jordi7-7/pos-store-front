import React from 'react';
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox';
import type { SupplierEntity } from '../../domain/entities/supplier.entity';

interface SupplierComboboxProps {
  suppliers: SupplierEntity[];
  value: string;
  onChange: (supplierId: string) => void;
  placeholder: string;
  emptyText: string;
  inputClassName: string;
  /** Si se indica, añade una primera opción con valor vacío (para los filtros: "Todos los proveedores"). */
  allLabel?: string;
  /** El campo muestra solo el nombre; por defecto, "nombre (identificación)". */
  nameOnly?: boolean;
}

/** Selector con búsqueda de proveedor, el mismo en el ingreso, la carga masiva y el filtro del historial. */
export const SupplierCombobox: React.FC<SupplierComboboxProps> = ({ suppliers, value, onChange, placeholder, emptyText, inputClassName, allLabel, nameOnly }) => {
  const selected = suppliers.find((supplier) => supplier.id === value);
  const shown = selected ? (nameOnly ? selected.name : `${selected.name} (${selected.identityNumber})`) : '';
  return (
    <Combobox value={value} onValueChange={(next) => onChange(next || '')}>
      <ComboboxInput placeholder={placeholder} className={inputClassName} showTrigger value={shown} />
      <ComboboxContent className="bg-popover border border-border rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
        <ComboboxEmpty className="p-3 text-center text-xs text-muted-foreground">{emptyText}</ComboboxEmpty>
        <ComboboxList className="p-1">
          {allLabel && (
            <ComboboxItem value="" className="text-xs py-1.5 cursor-pointer font-semibold text-primary">
              {allLabel}
            </ComboboxItem>
          )}
          {suppliers.map((supplier) => (
            <ComboboxItem key={supplier.id} value={supplier.id} className="text-xs py-1.5 cursor-pointer">
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">{supplier.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">RUC / ID: {supplier.identityNumber}</span>
              </div>
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
};
