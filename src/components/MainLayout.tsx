import React, { useState } from 'react';
import { useAuthStore } from '../modules/auth/hooks/useAuthStore';
import { useBranches } from '../modules/branches';
import { useMediaUpload } from '../modules/media';
import { Toaster, toast } from 'sonner';
import { SidebarProvider, SidebarTrigger } from './ui/sidebar';
import { TooltipProvider } from './ui/tooltip';
import { AppSidebar } from './AppSidebar';

import { useSales, useActiveCashSession, useExpenses } from '../modules/sales';
import { useSuppliers } from '../modules/purchases';

// Modular View Components
import { DashboardView } from '../modules/dashboard/components/DashboardView';
import { POSView } from '../modules/sales/components/POSView';
import { ProductsView } from '../modules/products/components/ProductsView';
import { PurchasesView } from '../modules/purchases/components/PurchasesView';
import { MediaView } from '../modules/media/components/MediaView';
import { UsersView } from '../modules/users/components/UsersView';

import { Building } from 'lucide-react';

export const MainLayout: React.FC = () => {
  const { user, activeTab } = useAuthStore();



  // TanStack Query Hooks for layout contexts
  const { branches } = useBranches();
  const { sales } = useSales();
  const { suppliers } = useSuppliers();

  // Media upload shared context hook
  const { uploadImage, uploadImageByUrl, isUploading, deleteImage, isDeleting, isLoading: isLoadingMedia, uploadedImages } = useMediaUpload();

  // Selected Branch Context
  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Shared Petty Cash Session State
  const [activeSession, setActiveSession] = useState<any>(null); 
  const [localExpenses, setLocalExpenses] = useState<any[]>([]);

  const { activeSession: fetchedSession } = useActiveCashSession(selectedBranchId);
  const { expenses: fetchedExpenses } = useExpenses({ branchId: selectedBranchId });

  // Sync activeSession with backend query
  React.useEffect(() => {
    if (fetchedSession !== undefined) {
      setActiveSession(fetchedSession);
    }
  }, [fetchedSession]);

  // Sync localExpenses with backend query
  React.useEffect(() => {
    if (fetchedExpenses) {
      const mapped = fetchedExpenses.map((exp: any) => ({
        id: exp.id,
        desc: exp.description,
        amount: Number(exp.amount),
        category: exp.category,
        cashSessionId: exp.cashSessionId,
        createdAt: exp.createdAt
      }));
      setLocalExpenses(mapped);
    }
  }, [fetchedExpenses]);

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
    { id: 'products', label: 'Catálogo de Productos' },
    { id: 'purchases', label: 'Compras y Proveedores' },
    { id: 'media', label: 'Multimedia / Galería' },
    { id: 'users', label: 'Personal / Usuarios' },
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

            </main>
          </div>
          <Toaster richColors closeButton theme="dark" position="top-right" />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
};
