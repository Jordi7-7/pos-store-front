import React, { useState } from 'react';
import { useAuthStore } from '../modules/auth/hooks/useAuthStore';
import { useBranches } from '../modules/branches';
import { useMediaUpload } from '../modules/media';
import { useSales, useActiveCashSession } from '../modules/sales';
import { useSuppliers } from '../modules/purchases';

// Modular View Components
import { DashboardView } from '../modules/dashboard/components/DashboardView';
import { POSView } from '../modules/sales/components/POSView';
import { ProductsView } from '../modules/products/components/ProductsView';
import { PurchasesView } from '../modules/purchases/components/PurchasesView';
import { MediaView } from '../modules/media/components/MediaView';
import { UsersView } from '../modules/users/components/UsersView';

import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Truck, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  Image as ImageIcon,
  ShieldCheck,
  Building
} from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { user, role, tenantId, activeTab, setActiveTab, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // TanStack Query Hooks for layout contexts
  const { branches } = useBranches();
  const { sales } = useSales();
  const { suppliers } = useSuppliers();

  // Media upload shared context hook
  const { uploadImage, isUploading, uploadedImages } = useMediaUpload();

  // Selected Branch Context
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Shared Petty Cash Session State
  const [activeSession, setActiveSession] = useState<any>(null); 
  const [localExpenses, setLocalExpenses] = useState<any[]>([]);

  const { activeSession: fetchedSession } = useActiveCashSession(selectedBranchId);

  // Sync activeSession with backend query
  React.useEffect(() => {
    if (fetchedSession !== undefined) {
      setActiveSession(fetchedSession);
    }
  }, [fetchedSession]);

  // Automatic Context Initialization
  React.useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadImage(file);
    } catch (err) {
      console.error(err);
      alert('Error en la subida multimedia.');
    }
  };

  // Tab configurations
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'pos', label: 'Punto de Venta (POS)', icon: ShoppingBag, roles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] },
    { id: 'products', label: 'Catálogo de Productos', icon: Package, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
    { id: 'purchases', label: 'Compras y Proveedores', icon: Truck, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
    { id: 'media', label: 'Multimedia / Galería', icon: ImageIcon, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
    { id: 'users', label: 'Personal / Usuarios', icon: Users, roles: ['OWNER', 'ADMIN'] },
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(role || ''));

  return (
    <div className="min-h-screen bg-bg-dark flex text-text-main font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-bg-card border-r border-border-card z-40 transform transition-transform duration-300 lg:transform-none flex flex-col justify-between ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Sidebar Header */}
        <div>
          <div className="p-6 border-b border-border-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-secondary block">POS STORE</span>
                <span className="text-[9px] text-primary font-mono font-semibold">ID: {tenantId?.substring(0, 8)}...</span>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="lg:hidden text-neutral hover:text-secondary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 ${
                    isActive 
                      ? 'bg-primary text-white shadow-md shadow-primary/10' 
                      : 'text-neutral hover:text-secondary hover:bg-bg-dark'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border-card bg-bg-dark/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-primary text-sm">
              {user?.name?.substring(0, 2) || 'US'}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold text-secondary block truncate">{user?.name}</span>
              <span className="text-[10px] text-neutral font-medium truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-primary inline" />
                {role}
              </span>
            </div>
          </div>

          <button 
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 text-xs font-semibold rounded-lg transition-all duration-150"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 border-b border-border-card bg-bg-card px-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 text-neutral hover:text-secondary bg-bg-dark rounded-lg border border-border-card"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold text-secondary uppercase tracking-wider">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Branch Selector */}
            {branches.length > 0 && (
              <div className="flex items-center gap-2 bg-bg-dark border border-border-card rounded-xl px-3 py-1">
                <Building className="w-3.5 h-3.5 text-neutral" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-transparent text-xs text-secondary font-semibold focus:outline-none cursor-pointer"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id} className="bg-bg-card text-secondary">{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs">
              <div className={`w-2 h-2 rounded-full ${activeSession ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-neutral font-medium">
                Caja Chica: <span className="text-secondary font-bold">{activeSession ? 'ABIERTA' : 'CERRADA'}</span>
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Content Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-bg-dark relative">
          
          {activeTab === 'dashboard' && (
            <DashboardView 
              user={user} 
              sales={sales} 
              suppliers={suppliers} 
              localExpenses={localExpenses} 
            />
          )}

          {activeTab === 'pos' && (
            <POSView 
              selectedBranchId={selectedBranchId} 
              activeSession={activeSession} 
              setActiveSession={setActiveSession} 
              localExpenses={localExpenses} 
              setLocalExpenses={setLocalExpenses} 
            />
          )}

          {activeTab === 'products' && (
            <ProductsView 
              selectedBranchId={selectedBranchId} 
              uploadedImages={uploadedImages} 
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesView />
          )}

          {activeTab === 'media' && (
            <MediaView 
              uploadedImages={uploadedImages} 
              isUploading={isUploading} 
              handleFileUpload={handleFileUpload} 
            />
          )}

          {activeTab === 'users' && (
            <UsersView 
              selectedBranchId={selectedBranchId} 
            />
          )}

        </main>
      </div>
    </div>
  );
};
