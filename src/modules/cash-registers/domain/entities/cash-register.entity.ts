/** Caja registradora de una sucursal, con su turno abierto si lo hay. */
export interface CashRegisterEntity {
  id: string;
  code: number;
  name: string;
  branchId: string;
  branchName: string;
  nextInvoiceNumber: number;
  isActive: boolean;
  isOpen: boolean;
  activeSession: {
    id: string;
    userId: string;
    userName: string;
    openedAt: string;
    openingBalance: number;
  } | null;
  assignedUserIds: string[];
}

/** Caja asignada al usuario actual (lo que necesita para abrir turno). */
export interface MyCashRegisterEntity {
  id: string;
  code: number;
  name: string;
  branchId: string;
  branchName: string;
  isOpen: boolean;
}
