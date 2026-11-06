import React from 'react';
import { Building, Store, ArrowRight } from 'lucide-react';
import type { Branch } from '@/modules/branches';

interface NoBranchSelectedProps {
  branches: Branch[] | undefined;
  onSelectBranch: (branchId: string) => void;
}

/** Pantalla previa al POS: el cajero debe elegir sucursal antes de vender. */
export const NoBranchSelected: React.FC<NoBranchSelectedProps> = ({ branches, onSelectBranch }) => (
  <div className="flex h-full min-h-[500px] flex-col items-center justify-center p-6 text-center">
    <div className="max-w-md w-full bg-bg-card border border-border-card rounded-2xl p-8 shadow-sm flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
        <Store className="w-8 h-8" />
      </div>

      <h2 className="text-lg font-bold text-secondary mb-2">Selecciona una sucursal para vender</h2>
      <p className="text-xs text-neutral leading-relaxed mb-6">
        El Punto de Venta requiere estar vinculado a una sucursal física para gestionar la caja registradora, turnos y movimientos de inventario.
      </p>

      <div className="w-full space-y-2">
        <span className="text-[11px] font-semibold text-neutral uppercase tracking-wider block text-left mb-1">Sucursales disponibles:</span>
        {branches && branches.length > 0 ? (
          branches.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectBranch(b.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-bg-dark hover:bg-primary/5 border border-border-card hover:border-primary/40 transition-all group text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-neutral group-hover:text-primary transition-colors" />
                <div>
                  <div className="text-xs font-bold text-secondary group-hover:text-primary transition-colors">{b.name}</div>
                  {b.address && <div className="text-[10px] text-neutral line-clamp-1">{b.address}</div>}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>
          ))
        ) : (
          <div className="p-3 text-xs text-neutral bg-bg-dark rounded-xl border border-border-card">
            No tienes sucursales asignadas. Contacta al administrador.
          </div>
        )}
      </div>
    </div>
  </div>
);
