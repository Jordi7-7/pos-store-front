export interface CashSessionHeader {
  id: string;
  branchId: string;
  userId: string;
  openingBalance: number;
  closingBalance: number | null;
  status: string;
  openedAt: string;
  closedAt: string | null;
  branch: { name: string };
  user: { name: string };
}

export interface CashSessionDetails {
  session: CashSessionHeader;
  sales: any[];
  expenses: any[];
  refunds: any[];
}
