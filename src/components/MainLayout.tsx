import React, { useState } from 'react';
import { useAuthStore } from '../modules/auth/hooks/useAuthStore';
import { useBranches } from '../modules/branches';
import { useMediaUpload } from '../modules/media';
import { Toaster, toast } from 'sonner';
import { SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { TooltipProvider } from './ui/tooltip';
import { AppSidebar } from './AppSidebar';

import { useSales, useActiveCashSession } from '../modules/sales';
import { useSuppliers } from '../modules/purchases';

// Modular View Components
import { DashboardView } from '../modules/dashboard/components/DashboardView';
import { POSView } from '../modules/sales/components/POSView';
import { SalesView } from '../modules/sales/components/SalesView';
import { ProductsView } from '../modules/products/components/ProductsView';
import { PurchasesView } from '../modules/purchases/components/PurchasesView';
import { MediaView } from '../modules/media/components/MediaView';
import { UsersView } from '../modules/users/components/UsersView';
import { TenantSettings } from '../modules/dashboard/components/TenantSettings';
import { ReportsView } from '../modules/reports/components/ReportsView';
import { CustomersView } from '../modules/customers/components/CustomersView';
import { CashSessionsHistoryView } from '../modules/cash-sessions/components/CashSessionsHistoryView';
import { CashRegistersView } from '../modules/cash-registers/components/CashRegistersView';
import { useMyCashRegisters } from '../modules/cash-registers/hooks/useCashRegisters';

import { Building, ChevronDown, CreditCard } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const {
    user,
    activeTab,
    selectedBranchId,
    setSelectedBranchId,
    selectedCashRegisterId,
    setSelectedCashRegisterId,
  } = useAuthStore();

  // TanStack Query Hooks for layout contexts (Lazy loaded based on activeTab)
  const { branches } = useBranches();
  const { sales } = useSales({ enabled: activeTab === 'dashboard' });
  const { suppliers } = useSuppliers({ enabled: activeTab === 'dashboard' || activeTab === 'purchases' });

  // Cash registers authorized for this branch and user
  const { myCashRegisters: availableRegisters } = useMyCashRegisters(selectedBranchId || undefined);

  // Media upload shared context hook (only fetch images when on media, products or dashboard tabs)
  const { uploadImage, uploadImageByUrl, isUploading, deleteImage, isDeleting, isLoading: isLoadingMedia, uploadedImages } = useMediaUpload({
    enabled: activeTab === 'media' || activeTab === 'products',
  });

  // Shared Petty Cash Session State
  const [activeSession, setActiveSession] = useState<any>(null); 

  const { activeSession: fetchedSession } = useActiveCashSession(
    selectedBranchId || undefined,
    selectedCashRegisterId || undefined
  );

  // Auto-sync selectedCashRegisterId when registers change
  React.useEffect(() => {
    if (availableRegisters && availableRegisters.length > 0) {
      if (!selectedCashRegisterId || !availableRegisters.some((r) => r.id === selectedCashRegisterId)) {
        setSelectedCashRegisterId(availableRegisters[0].id);
      }
    } else if (availableRegisters && availableRegisters.length === 0) {
      if (selectedCashRegisterId) {
        setSelectedCashRegisterId(null);
      }
    }
  }, [availableRegisters, selectedCashRegisterId, setSelectedCashRegisterId]);

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

  const handleUpload = async (file: File, description: string) => {
    try {
      await uploadImage({ file, description });
      toast.success('¡Imagen subida con éxito!');
    } catch (err) {
      console.error(err);
      toast.error('Error en la subida multimedia.');
    }
  };

  const handleUploadByUrl = async (url: string, description: string) => {
    try {
      await uploadImageByUrl({ url, description });
      toast.success('¡Imagen de internet descargada y registrada con éxito!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al procesar la imagen externa.');
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      await deleteImage(id);
      toast.success('Imagen eliminada de la galería.');
    } catch (err: any) {
      console.error(err);
      const message = err?.message || 'Error al eliminar la imagen.';
      toast.error(message);
    }
  };

  // Tab configurations
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'pos', label: 'Punto de Venta (POS)' },
    { id: 'sales', label: 'Ventas' },
    { id: 'products', label: 'Catálogo de Productos' },
    { id: 'purchases', label: 'Compras y Proveedores' },
    { id: 'media', label: 'Multimedia / Galería' },
    { id: 'users', label: 'Personal / Usuarios' },
    { id: 'reports', label: 'Reportes y Utilidades' },
    { id: 'customers', label: 'Directorio de Clientes' },
    { id: 'cash-sessions', label: 'Historial de Cajas' },
    { id: 'cash-registers', label: 'Cajas Registradoras' },
    { id: 'tenant-settings', label: 'Configuración' },
  ];


  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-bg-dark flex text-text-main font-sans w-full overflow-hidden">
          
          <AppSidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            
            {/* Top Header */}
            <header className="h-16 border-b border-border-card bg-bg-card px-6 flex items-center justify-between z-20 shrink-0">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="text-neutral hover:text-secondary cursor-pointer" />
                <h1 className="text-xs font-bold text-secondary uppercase tracking-wider">
                  {menuItems.find(i => i.id === activeTab)?.label}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                {/* Branch Selector */}
                {(() => {
                  const allowedBranches = branches && branches.length > 0
                    ? (user?.branchIds && user.branchIds.length > 0
                        ? branches.filter(b => user.branchIds!.includes(b.id))
                        : branches)
                    : [];

                  if (allowedBranches.length === 0) return null;

                  return (
                    <div className="flex items-center gap-2 bg-bg-dark border border-border-card rounded-xl px-3 py-1">
                      <Building className="w-3.5 h-3.5 text-neutral" />
                      <select
                        value={selectedBranchId || ''}
                        onChange={(e) => setSelectedBranchId(e.target.value)}
                        disabled={allowedBranches.length === 1}
                        className="bg-transparent text-xs text-secondary font-semibold focus:outline-none cursor-pointer disabled:cursor-default"
                      >
                        {allowedBranches.map(b => (
                          <option key={b.id} value={b.id} className="bg-bg-card text-secondary">{b.name}</option>
                        ))}
                      </select>
                    </div>
                  );
                })()}

                {/* Cash Register Selector / Indicator */}
                {availableRegisters && availableRegisters.length > 0 && (
                  <div className="flex items-center gap-2 bg-bg-dark border border-border-card rounded-xl px-3 py-1">
                    <CreditCard className="w-3.5 h-3.5 text-neutral" />
                    <select
                      value={selectedCashRegisterId || ''}
                      onChange={(e) => setSelectedCashRegisterId(e.target.value)}
                      disabled={availableRegisters.length === 1}
                      className="bg-transparent text-xs text-secondary font-semibold focus:outline-none cursor-pointer disabled:cursor-default"
                      title={availableRegisters.length === 1 ? 'Caja asignada única' : 'Seleccionar caja registradora'}
                    >
                      {availableRegisters.map((reg) => (
                        <option key={reg.id} value={reg.id} className="bg-bg-card text-secondary">
                          {reg.name} {reg.isOpen ? '🟢' : '⚪'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* User quick pill like in reference photo (Leiza v) */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs font-medium text-secondary">
                  <span className="w-2 h-2 rounded-sm bg-neutral/40" />
                  <span className="font-semibold">{user?.name?.split(' ')[0] || 'Cajero'}</span>
                  <ChevronDown className="w-3 h-3 text-neutral" />
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs">
                  <div className={`w-2 h-2 rounded-full ${activeSession ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="text-neutral font-medium">
                    Caja: <span className="text-secondary font-bold">{activeSession ? 'ABIERTA' : 'CERRADA'}</span>
                    {(activeSession?.openedByName || activeSession?.user?.name) && (
                      <span className="text-[11px] text-neutral font-normal ml-1">
                        ({(activeSession.openedByName || activeSession.user.name).split(' ')[0]})
                      </span>
                    )}
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
                />
              )}

              {activeTab === 'pos' && (
                <POSView 
                  selectedBranchId={selectedBranchId || ''} 
                  activeSession={activeSession} 
                  setActiveSession={setActiveSession} 
                />
              )}

              {activeTab === 'sales' && (
                <SalesView />
              )}

              {activeTab === 'products' && (
                <ProductsView 
                  selectedBranchId={selectedBranchId || ''} 
                  uploadedImages={uploadedImages} 
                />
              )}

              {activeTab === 'purchases' && (
                <PurchasesView selectedBranchId={selectedBranchId || ''} />
              )}

              {activeTab === 'media' && (
                <MediaView 
                  uploadedImages={uploadedImages} 
                  isUploading={isUploading} 
                  isDeleting={isDeleting}
                  isLoading={isLoadingMedia}
                  onUpload={handleUpload} 
                  onUploadByUrl={handleUploadByUrl}
                  onDelete={handleDeleteImage}
                />
              )}

              {activeTab === 'users' && (
                <UsersView />
              )}

              {activeTab === 'reports' && (
                <ReportsView />
              )}

              {activeTab === 'customers' && (
                <CustomersView />
              )}

              {activeTab === 'cash-sessions' && (
                <CashSessionsHistoryView />
              )}

              {activeTab === 'cash-registers' && (
                <CashRegistersView />
              )}

              {activeTab === 'tenant-settings' && (
                <TenantSettings />
              )}

            </main>
          </div>
          <Toaster richColors closeButton theme="dark" position="top-right" />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};
