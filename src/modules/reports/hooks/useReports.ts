import { useState } from 'react';
import { reportsService } from '../services/reports.service';
import type { ReportsResponse, SalesCostReportRow, ValuedInventoryRow } from '../types/reports.types';
import { toast } from 'sonner';

export const useReportsSummary = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReportsResponse | null>(null);

  const fetchSummary = async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      const res = await reportsService.getSummary(startDate, endDate);
      setData(res);
      return res;
    } catch (error) {
      console.error('Error fetching reports summary:', error);
      toast.error('Error al cargar reporte de estadísticas');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    data,
    fetchSummary
  };
};

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
