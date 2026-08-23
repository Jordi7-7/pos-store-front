import React, { useState } from 'react';
import { useCreateUser, useUsers, useGeneratePin } from '../hooks/useUsers';
import { Key, Copy, Check, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UsersViewProps {}

export const UsersView: React.FC<UsersViewProps> = () => {
  const { createUser, isCreating } = useCreateUser();
  const { users, isLoading, refetchUsers } = useUsers();
  const { generatePin, isGenerating } = useGeneratePin();

  // New user form inputs
  const [usrName, setUsrName] = useState('');
  const [usrEmail, setUsrEmail] = useState('');
  const [usrPassword, setUsrPassword] = useState('');
  const [usrRole, setUsrRole] = useState<'CASHIER' | 'MANAGER' | 'ADMIN'>('CASHIER');

  // Modal states for pin exhibition
  const [showPinModal, setShowPinModal] = useState(false);
  const [revealedPin, setRevealedPin] = useState('');
  const [pinTargetUser, setPinTargetUser] = useState<any>(null);
  const [copied, setCopied] = useState(false);

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
      toast.success('Usuario registrado con éxito.');
      setUsrName('');
      setUsrEmail('');
      setUsrPassword('');
      refetchUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Error al crear usuario.');
    }
  };

  const handleGeneratePin = async (user: any) => {
    try {
      const res = await generatePin(user.id);
      setRevealedPin(res.pin);
      setPinTargetUser(user);
      setShowPinModal(true);
      refetchUsers();
    } catch (err: any) {
      toast.error(err?.message || 'Error al generar PIN.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(revealedPin);
    setCopied(true);
    toast.success('PIN copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Formulario de creación de Usuario */}
      <form onSubmit={handleCreateUser} className="bg-bg-card border border-border-card rounded-2xl p-6 space-y-4 shadow-sm h-fit">
        <h4 className="text-xs font-bold text-secondary uppercase tracking-wide border-b border-border-card pb-2">Registrar Usuario ERP</h4>
        
        <div>
          <label className="block text-[11px] font-medium text-neutral mb-1">Nombre Completo *</label>
          <input 
            type="text" 
            required
            value={usrName}
            onChange={(e) => setUsrName(e.target.value)}
            placeholder="Ej: Jordi Cajero" 
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

        <button 
          type="submit" 
          disabled={isCreating}
          className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-lg transition-colors mt-6 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Crear e Invitar Usuario'}
        </button>
      </form>

      {/* Lista de Usuarios */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-secondary">Personal Registrado</h3>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-neutral" /></div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral bg-bg-card border border-border-card rounded-2xl">
            No hay otros usuarios registrados en el sistema.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((usr) => (
              <div key={usr.id} className="p-4 bg-bg-card border border-border-card rounded-2xl flex items-center justify-between shadow-sm gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-secondary truncate block">{usr.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-bold border border-primary/20 uppercase shrink-0">
                      {usr.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral truncate block">{usr.email}</span>
                  {usr.pinEnabled ? (
                    <span className="text-[8.5px] font-bold text-emerald-500 uppercase mt-1 block">PIN Activo</span>
                  ) : (
                    <span className="text-[8.5px] font-bold text-neutral-400 uppercase mt-1 block">Sin PIN de Acceso</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleGeneratePin(usr)}
                  disabled={isGenerating}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-bg-dark border border-border-card text-neutral hover:text-secondary hover:border-primary/30 transition-all cursor-pointer"
                >
                  <Key className="w-3 h-3 text-primary" />
                  {usr.pinEnabled ? 'Cambiar PIN' : 'Asignar PIN'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para exhibir el PIN una sola vez */}
      <Dialog open={showPinModal} onOpenChange={(open) => { if (!open) setShowPinModal(false); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2 mb-3">
              <Key className="w-4 h-4 text-primary" />
              <span>PIN Generado Exitosamente</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span className="text-[10px] font-medium leading-relaxed">
                Por motivos de seguridad, este PIN solo se mostrará <strong>una vez</strong>. Cópialo y compártelo con <strong>{pinTargetUser?.name}</strong>.
              </span>
            </div>

            <div className="flex items-center justify-between bg-bg-dark border border-border-card rounded-xl p-4">
              <div className="text-2xl font-mono font-extrabold text-secondary tracking-widest pl-2">
                {revealedPin}
              </div>
              <button
                type="button"
                onClick={copyToClipboard}
                className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default UsersView;
