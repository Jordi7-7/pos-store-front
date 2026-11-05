import React, { createContext, useContext } from 'react';
import { useAuthStore, useIsOwner, useUser } from '@/modules/auth';
import { useBranches, type Branch } from '@/modules/branches';

interface LayoutContextType {
  selectedBranchId: string | null;
  setSelectedBranchId: (branchId: string | null) => void;
  branches: Branch[];
  selectedBranch: Branch | null;
  selectedBranchName: string;
  isOwner: boolean;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export const LayoutContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedBranchId, setSelectedBranchId } = useAuthStore();
  const user = useUser();

  const { branches } = useBranches();
  const isOwner = useIsOwner();

  // Filter allowed branches (OWNER sees all, cashier sees assigned branchIds)
  const allowedBranches = React.useMemo(() => {
    if (!branches || branches.length === 0) return [];
    if (!isOwner && user && user.branches.length > 0) {
      const assignedIds = user.branches.map((b) => b.id);
      return branches.filter((b: Branch) => assignedIds.includes(b.id));
    }
    return branches;
  }, [branches, user, isOwner]);

  const selectedBranch = React.useMemo(() => {
    if (!selectedBranchId || allowedBranches.length === 0) return null;
    return allowedBranches.find((b: Branch) => b.id === selectedBranchId) || null;
  }, [allowedBranches, selectedBranchId]);

  const selectedBranchName = React.useMemo(() => {
    if (selectedBranch?.name) return selectedBranch.name;
    if (!selectedBranchId) return 'Todas las Sucursales';
    return 'Sucursal Principal';
  }, [selectedBranch, selectedBranchId]);

  React.useEffect(() => {
    if (allowedBranches.length > 0) {
      if (isOwner && !selectedBranchId) {
        // OWNER is allowed to stay in null / consolidated view
        return;
      }
      const isSelectedValid = allowedBranches.some((b: Branch) => b.id === selectedBranchId);
      if (!selectedBranchId || !isSelectedValid) {
        const firstBranch = allowedBranches[0];
        if (firstBranch) {
          setSelectedBranchId(firstBranch.id);
        }
      }
    }
  }, [allowedBranches, selectedBranchId, setSelectedBranchId, isOwner]);

  return (
    <LayoutContext.Provider
      value={{
        selectedBranchId,
        setSelectedBranchId,
        branches: allowedBranches,
        selectedBranch,
        selectedBranchName,
        isOwner,
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
