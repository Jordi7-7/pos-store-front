export interface SummaryData {
  totalSales: number;
  totalCOGS: number;
  grossProfit: number;
  totalPurchases: number;
  totalExpenses: number;
  netProfit: number;
}

export interface BreakdownDay {
  date: string;
  sales: number;
  purchases: number;
  expenses: number;
  profit: number;
}

export interface ReportsResponse {
  summary: SummaryData;
  breakdown: BreakdownDay[];
}

export interface SalesCostReportRow {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  clientName: string;
  pieces: number;
  salePrice: number;
  costPrice: number;
  difference: number;
  status: string;
}
