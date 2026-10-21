import { CashSessionStatus, CashSessionDifferenceStatus } from '../enums';
import { SaleStatus } from '@/modules/sales/enums';

export interface CashSessionHeaderEntity {
  id: string;
  branchId?: string;
  userId?: string;
  openingBalance: number;
  openingBalanceFormatted: string;
  closingBalance: number | null;
  closingBalanceFormatted: string;
  expectedBalance: number | null;
  expectedBalanceFormatted: string;
  difference: number | null;
  differenceFormatted: string;
  differenceStatus: CashSessionDifferenceStatus;
  differenceStatusText: string;
  status: CashSessionStatus;
  isClosed: boolean;
  openedAt: string;
  openedAtFormatted: string;
  closedAt: string | null;
  closedAtFormatted: string;
  dateFormatted: string;
  openTimeFormatted: string;
  closeTimeFormatted: string;
  timeRangeFormatted: string;
  durationFormatted: string;
  openedByName: string;
  branchName: string;
  branchAddress: string;
  cashRegisterName: string;
  cashRegisterCode: string;
  totalSales: number;
  totalSalesFormatted: string;
}

export interface SessionKPIsEntity {
  grossSales: number;
  grossSalesFormatted: string;
  netSales: number;
  netSalesFormatted: string;
  cashSales: number;
  cashSalesFormatted: string;
  cardSales: number;
  cardSalesFormatted: string;
  totalExpenses: number;
  totalExpensesFormatted: string;
  totalRefunds: number;
  totalRefundsFormatted: string;
  salesCount: number;
  expensesCount: number;
  refundsCount: number;
  expensesLabel: string;
  refundsLabel: string;
}

export interface CashSessionSaleItemEntity {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  combinationText: string;
  quantity: number;
  price: number;
  priceFormatted: string;
  discountAmount: number;
  total: number;
  totalFormatted: string;
}

export interface CashSessionSalePaymentEntity {
  id: string;
  paymentMethod: string;
  amount: number;
  amountFormatted: string;
}

export interface CashSessionSaleEntity {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  createdAtFormatted: string;
  userName: string;
  customerName: string;
  customerIdentity: string;
  totalItems: number;
  status: SaleStatus;
  statusLabel: string;
  subtotal: number;
  subtotalFormatted: string;
  discountAmount: number;
  discountAmountFormatted: string;
  itemsDiscountAmount: number;
  globalDiscountAmount: number;
  total: number;
  totalFormatted: string;
  paymentMethod: string;
  paymentMethodsLabel: string;
  payments: CashSessionSalePaymentEntity[];
  items: CashSessionSaleItemEntity[];
}

export interface CashSessionExpenseEntity {
  id: string;
  description: string;
  amount: number;
  amountFormatted: string;
  createdAt: string;
  createdAtFormatted: string;
  userName: string;
  category: string;
}

export interface CashSessionRefundEntity {
  id: string;
  reason: string;
  totalRefunded: number;
  totalRefundedFormatted: string;
  createdAt: string;
  createdAtFormatted: string;
  userName: string;
  invoiceNumber: string;
}

export interface CashSessionDetailsEntity {
  session: CashSessionHeaderEntity;
  kpis: SessionKPIsEntity;
  sales: CashSessionSaleEntity[];
  expenses: CashSessionExpenseEntity[];
  refunds: CashSessionRefundEntity[];
}
