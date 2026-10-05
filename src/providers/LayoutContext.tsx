import React, { createContext, useContext } from 'react';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import { useBranches } from '@/modules/branches';

interface LayoutContextType {
  selectedBranchId: string | null;
  setSelectedBranchId: (branchId: string | null) => void;
  branches: any[];
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export const LayoutContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    selectedBranchId,
    setSelectedBranchId,
  } = useAuthStore();

  const { branches } = useBranches();

  React.useEffect(() => {
    if (branches && branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId, setSelectedBranchId]);

  return (
    <LayoutContext.Provider
      value={{
        selectedBranchId,
        setSelectedBranchId,
        branches: branches || [],
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
