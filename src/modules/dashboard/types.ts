export interface DashboardMetrics {
  today: {
    totalSales: number;
    itemsCount: number;
  };
  paymentMethods: {
    total: number;
    cash: {
      amount: number;
      percentage: number;
    };
    card: {
      amount: number;
      percentage: number;
    };
  };
  topProducts: Array<{
    variantId: string;
    productName: string;
    sku: string;
    imageUrl: string | null;
    quantitySold: number;
  }>;
  lowStockProducts: Array<{
    variantId: string;
    productName: string;
    sku: string;
    stock: number;
  }>;
  yesterdaySoldProducts: Array<{
    variantId: string;
    productName: string;
    sku: string;
    currentStock: number;
  }>;
  weekSummary: {
    totalWeek: number;
    changePercentage: number;
    dailyBreakdown: Array<{
      dayKey: string;
      label: string;
      total: number;
    }>;
  };
}
