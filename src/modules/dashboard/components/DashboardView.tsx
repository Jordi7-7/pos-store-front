import React from 'react';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { 
  TrendingUp, 
  ShoppingCart, 
  Truck, 
  Vault, 
  ArrowDownRight, 
  Layers 
} from 'lucide-react';

interface DashboardViewProps {
  user: any;
  sales: any[];
  suppliers: any[];
  localExpenses: any[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  sales,
  suppliers,
  localExpenses
}) => {
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';
  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/5 to-bg-card border border-primary/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-secondary mb-1">¡Bienvenido al panel, {user?.name}!</h2>
          <p className="text-xs text-neutral">Instancia de negocio conectada con API NestJS e inventario en Kardex.</p>
        </div>
        <div className="text-xs text-neutral font-mono bg-bg-dark px-3 py-1.5 rounded-lg border border-border-card">
          Tenant JWT: <span className="text-primary font-semibold">Activo</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 bg-bg-card border border-border-card rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral uppercase tracking-widest font-semibold">Ventas Registradas</span>
            <h3 className="text-2xl font-black text-secondary">{sales.length} Ventas</h3>
            <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Sincronizado con API
            </p>
          </div>
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
            <ShoppingCart className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div className="p-5 bg-bg-card border border-border-card rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral uppercase tracking-widest font-semibold">Directorio Proveedores</span>
            <h3 className="text-2xl font-black text-secondary">{suppliers.length} Proveedores</h3>
            <p className="text-[10px] text-neutral flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-neutral" /> Contactos activos
            </p>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <Truck className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="p-5 bg-bg-card border border-border-card rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral uppercase tracking-widest font-semibold">Gastos / Caja Chica</span>
            <h3 className="text-2xl font-black text-secondary">
              ${localExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
            </h3>
            <p className="text-[10px] text-amber-500 flex items-center gap-1 font-semibold">
              <ArrowDownRight className="w-3.5 h-3.5 text-amber-500" /> Sesión en sucursal
            </p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Vault className="w-6 h-6 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-bg-card border border-border-card rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-secondary">Historial de Ventas</h3>
        </div>
        {sales.length === 0 ? (
          <div className="text-xs text-neutral py-6 text-center">No hay transacciones registradas todavía en el backend.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-neutral border-b border-border-card">
                  <th className="pb-3 font-semibold">Referencia ID</th>
                  <th className="pb-3 font-semibold">Monto Total</th>
                  <th className="pb-3 font-semibold">Fecha</th>
                  <th className="pb-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-card/50">
                {sales.map((sale: any) => (
                  <tr key={sale.id} className="text-secondary">
                    <td className="py-3 font-mono">{sale.id.substring(0, 8)}...</td>
                    <td className="py-3 font-semibold text-emerald-600">
                      ${sale.total?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-3">{new Date(sale.createdAt).toLocaleDateString(undefined, { timeZone: timezone })}</td>
                    <td className="py-3">
                      {sale.status === 'REFUNDED' ? (
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-semibold border border-rose-200">
                          Devueltos
                        </span>
                      ) : sale.status === 'PARTIALLY_REFUNDED' ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold border border-amber-200">
                          Parcial
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold border border-emerald-200">
                          Completada
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default DashboardView;
