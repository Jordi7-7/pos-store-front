import React, { createContext, useContext, useState } from 'react';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import { useBranches } from '@/modules/branches';
import { useSales, useActiveCashSession } from '@/modules/sales';
import { useSuppliers } from '@/modules/purchases';
import { useMyCashRegisters } from '@/modules/cash-registers/hooks/useCashRegisters';
import { useMediaUpload } from '@/modules/media';
import { toast } from 'sonner';

interface LayoutContextType {
  selectedBranchId: string | null;
  setSelectedBranchId: (branchId: string | null) => void;
  selectedCashRegisterId: string | null;
  setSelectedCashRegisterId: (registerId: string | null) => void;
  branches: any[];
  availableRegisters: any[];
  activeSession: any;
  setActiveSession: (session: any) => void;
  sales: any[];
  suppliers: any[];
  uploadedImages: any[];
  uploadImage: (params: { file: File; description: string }) => Promise<any>;
  uploadImageByUrl: (params: { url: string; description: string }) => Promise<any>;
  deleteImage: (id: string) => Promise<any>;
  isUploading: boolean;
  isDeleting: boolean;
  isLoadingMedia: boolean;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export const LayoutContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    selectedBranchId,
    setSelectedBranchId,
    selectedCashRegisterId,
    setSelectedCashRegisterId,
  } = useAuthStore();

  const { branches } = useBranches();
  const { sales } = useSales();
  const { suppliers } = useSuppliers();
  const { myCashRegisters: availableRegisters } = useMyCashRegisters(selectedBranchId || undefined);

  const {
    uploadImage,
    uploadImageByUrl,
    isUploading,
    deleteImage,
    isDeleting,
    isLoading: isLoadingMedia,
    uploadedImages,
  } = useMediaUpload();

  const [activeSession, setActiveSession] = useState<any>(null);

  const { activeSession: fetchedSession } = useActiveCashSession(
    selectedBranchId || undefined,
    selectedCashRegisterId || undefined
  );

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

  React.useEffect(() => {
    if (fetchedSession !== undefined) {
      setActiveSession(fetchedSession);
    }
  }, [fetchedSession]);

  React.useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId, setSelectedBranchId]);

  const handleUpload = async (params: { file: File; description: string }) => {
    try {
      const res = await uploadImage(params);
      toast.success('¡Imagen subida con éxito!');
      return res;
    } catch (err: any) {
      console.error(err);
      toast.error('Error en la subida multimedia.');
      throw err;
    }
  };

  const handleUploadByUrl = async (params: { url: string; description: string }) => {
    try {
      const res = await uploadImageByUrl(params);
      toast.success('¡Imagen de internet descargada y registrada con éxito!');
      return res;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al procesar la imagen externa.');
      throw err;
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      const res = await deleteImage(id);
      toast.success('Imagen eliminada de la galería.');
      return res;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al eliminar la imagen.');
      throw err;
    }
  };

  return (
    <LayoutContext.Provider
      value={{
        selectedBranchId,
        setSelectedBranchId,
        selectedCashRegisterId,
        setSelectedCashRegisterId,
        branches: branches || [],
        availableRegisters: availableRegisters || [],
        activeSession,
        setActiveSession,
        sales: sales || [],
        suppliers: suppliers || [],
        uploadedImages: uploadedImages || [],
        uploadImage: handleUpload,
        uploadImageByUrl: handleUploadByUrl,
        deleteImage: handleDeleteImage,
        isUploading,
        isDeleting,
        isLoadingMedia,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within a LayoutContextProvider');
  }
  return context;
};
