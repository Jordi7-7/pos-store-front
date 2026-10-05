import React, { createContext, useContext, useState } from 'react';
import { useAuthStore } from '@/modules/auth/hooks/useAuthStore';
import { useBranches } from '@/modules/branches';
import { useActiveCashSession } from '@/modules/sales';
import { useMyCashRegisters } from '@/modules/cash-registers/hooks/useCashRegisters';

interface LayoutContextType {
  selectedBranchId: string | null;
  setSelectedBranchId: (branchId: string | null) => void;
  selectedCashRegisterId: string | null;
  setSelectedCashRegisterId: (registerId: string | null) => void;
  branches: any[];
  availableRegisters: any[];
  activeSession: any;
  setActiveSession: (session: any) => void;
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
  const { myCashRegisters: availableRegisters } = useMyCashRegisters(selectedBranchId || undefined);

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
