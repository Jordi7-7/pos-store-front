import React, { useState } from 'react';
import { useCreateUser } from '../hooks/useUsers';
import { useBranches } from '../../branches/hooks/useBranches';

interface UsersViewProps {
  selectedBranchId: string;
}

export const UsersView: React.FC<UsersViewProps> = ({
  selectedBranchId
}) => {
  const { branches } = useBranches();
  const { createUser } = useCreateUser();

  // Local User inputs
  const [localUsers, setLocalUsers] = useState<any[]>([
    { name: 'María Inés', role: 'MANAGER', email: 'maria@minegocio.com', branch: 'Matriz Norte' },
    { name: 'Juan Carlos', role: 'CASHIER', email: 'juan@minegocio.com', branch: 'Matriz Norte' }
  ]);
  const [usrName, setUsrName] = useState('');
  const [usrEmail, setUsrEmail] = useState('');
  const [usrPassword, setUsrPassword] = useState('');
  const [usrRole, setUsrRole] = useState<'CASHIER' | 'MANAGER' | 'ADMIN'>('CASHIER');
  const [usrSuccess, setUsrSuccess] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usrName || !usrEmail || !usrPassword) return;
    try {
      await createUser({
        name: usrName,
        email: usrEmail,
        password: usrPassword,
        role: usrRole,
      });
      setLocalUsers([...localUsers, {
        name: usrName,
        email: usrEmail,
        role: usrRole,
        branch: selectedBranchId ? branches.find(b => b.id === selectedBranchId)?.name || 'Matriz Norte' : 'Matriz Norte'
      }]);
      setUsrSuccess('¡Usuario administrativo creado con éxito!');
      setUsrName('');
      setUsrEmail('');
      setUsrPassword('');
      setTimeout(() => setUsrSuccess(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Formulario de creación de Usuario */}
      <form onSubmit={handleCreateUser} className="bg-bg-card border border-border-card rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-secondary uppercase tracking-wide border-b border-border-card pb-2">Registrar Usuario ERP</h4>
          
          {usrSuccess && (
            <div className="p-3 rounded-lg bg-emerald-100 border border-emerald-200 text-emerald-805 text-xs font-medium">
              {usrSuccess}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-neutral mb-1">Nombre Completo *</label>
            <input 
              type="text" 
              required
              value={usrName}
              onChange={(e) => setUsrName(e.target.value)}
              placeholder="Jordi Cajero" 
              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral mb-1">Correo Electrónico *</label>
            <input 
              type="email" 
              required
              value={usrEmail}
              onChange={(e) => setUsrEmail(e.target.value)}
              placeholder="usuario@minegocio.com" 
              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral mb-1">Contraseña Temporal *</label>
            <input 
              type="password" 
              required
              value={usrPassword}
              onChange={(e) => setUsrPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3.5 text-xs text-secondary placeholder-gray-400 focus:outline-none focus:border-primary" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral mb-1">Rol Operativo</label>
            <select 
              value={usrRole}
              onChange={(e) => setUsrRole(e.target.value as any)}
              className="w-full bg-bg-dark border border-border-card rounded-xl py-2 px-3 text-xs text-secondary focus:outline-none focus:border-primary"
            >
              <option value="CASHIER">Cajero (POS)</option>
              <option value="MANAGER">Manager / Sucursal</option>
              <option value="ADMIN">Administrador General</option>
            </select>
          </div>
        </div>

        <button type="submit" className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-lg transition-colors mt-6">
          Crear e Invitar Usuario
        </button>
      </form>

      {/* Lista de Usuarios */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-secondary">Personal Registrado</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {localUsers.map((usr, idx) => (
            <div key={idx} className="p-4 bg-bg-card border border-border-card rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-secondary block">{usr.name}</span>
                <span className="text-[10px] text-neutral block">{usr.email}</span>
                <span className="text-[9px] text-neutral font-mono mt-1 block">{usr.branch}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-semibold border border-primary/20 uppercase">
                {usr.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default UsersView;
