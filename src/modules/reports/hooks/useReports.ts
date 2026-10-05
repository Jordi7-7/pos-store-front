import { useState } from 'react';
import { reportsService } from '../services/reports.service';
import type { SalesCostReportRow, ValuedInventoryRow, ProductSaleRow } from '../types/reports.types';
import { toast } from 'sonner';

export const useSalesCostReport = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SalesCostReportRow[]>([]);

  const fetchSalesCost = async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      const res = await reportsService.getSalesCost(startDate, endDate);
      setData(res);
      return res;
    } catch (error) {
      console.error('Error fetching sales cost report:', error);
      toast.error('Error al generar el reporte de costo de ventas');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    data,
    fetchSalesCost
  };
};

export const useValuedInventoryReport = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ValuedInventoryRow[]>([]);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number; totalPages: number; totalQuantity?: number; totalValue?: number }>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const fetchValuedInventory = async (params?: { page?: number; limit?: number }) => {
    try {
      setLoading(true);
      const res = await reportsService.getValuedInventory(params);
      setData(res.data);
      setMeta(res.meta);
      return res;
    } catch (error) {
      console.error('Error fetching valued inventory report:', error);
      toast.error('Error al generar el reporte de existencias valuadas');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    data,
    meta,
    fetchValuedInventory
  };
};

export const useProductSalesReport = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductSaleRow[]>([]);

  const fetchProductSales = async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      const res = await reportsService.getProductSales(startDate, endDate);
      setData(res);
      return res;
    } catch (error) {
      console.error('Error fetching product sales report:', error);
      toast.error('Error al generar el reporte de ventas por producto');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    data,
    fetchProductSales
  };
};

