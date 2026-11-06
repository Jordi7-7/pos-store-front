import { CashSessionStatus, CashSessionDifferenceStatus } from '../enums';
import { PaymentMethod, SaleStatus } from '@/modules/sales/domain/enums';

/**
 * Entidades del turno de caja: solo datos del negocio (números, fechas ISO, enums). Cómo se
 * muestran (moneda, idioma, zona horaria, textos) lo decide la capa de presentación con los
 * view-models de `presentation/view-models`.
 */

export interface CashSessionHeaderEntity {
  id: string;
  branchId?: string;
  userId?: string;
  openingBalance: number;
  closingBalance: number | null;
  expectedBalance: number | null;
  difference: number | null;
  differenceStatus: CashSessionDifferenceStatus;
  status: CashSessionStatus;
  isClosed: boolean;
  openedAt: string;
  closedAt: string | null;
  openedByName: string;
  branchName: string;
  branchAddress: string;
  cashRegisterName: string;
  cashRegisterCode: string;
  totalSales: number;
}

export interface SessionKPIsEntity {
  grossSales: number;
  netSales: number;
  cashSales: number;
  cardSales: number;
  totalExpenses: number;
  totalRefunds: number;
  salesCount: number;
  expensesCount: number;
  refundsCount: number;
}

export interface CashSessionSaleItemEntity {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  combinationText: string;
  quantity: number;
  price: number;
  discountAmount: number;
  total: number;
}

export interface CashSessionSalePaymentEntity {
  id: string;
  paymentMethod: string;
  amount: number;
}

export interface CashSessionSaleEntity {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  userName: string;
  customerName: string;
  customerIdentity: string;
  totalItems: number;
  status: SaleStatus;
  subtotal: number;
  discountAmount: number;
  itemsDiscountAmount: number;
  globalDiscountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  payments: CashSessionSalePaymentEntity[];
  items: CashSessionSaleItemEntity[];
}

export interface CashSessionExpenseEntity {
  id: string;
  description: string;
  amount: number;
  createdAt: string;
  userName: string;
  category: string;
}

export interface CashSessionRefundEntity {
  id: string;
  reason: string;
  totalRefunded: number;
  createdAt: string;
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
