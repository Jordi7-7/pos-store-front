import React, { useState, useMemo, useEffect, useRef } from 'react';
import { productsService } from '../../products/services/products.service';
import { useBranches } from '../../branches/hooks/useBranches';
import {
  useOpenCashSession,
  useCloseCashSession,
  useRegisterExpense,
  useProcessSale
} from '../hooks/useSales';
import { useCustomers } from '../hooks/useCustomers';
import { useCashSessionDetailsQuery } from '../../cash-sessions/hooks/useCashSessions';
import { PaymentMethod } from '../services/sales.service';
import type { Sale } from '../services/sales.service';
import type {
  SessionSale,
  SessionExpense,
  SessionRefund,
} from '../../cash-sessions/types/cash-sessions.types';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import {
  Search, Wallet, ArrowRightLeft, ArrowLeftRight, Receipt, X,
  ShoppingCart, Trash2, Minus, Plus, CreditCard, Loader2, Package,
  Percent, DollarSign, Check, Banknote, Maximize2
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { DateTime } from 'luxon';
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxTrigger,
} from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

// Subcomponents import
import { ThermalTicketModal } from './pos/ThermalTicketModal';
import { ThermalClosingTicketModal } from './pos/ThermalClosingTicketModal';
import { AperturaModal } from './pos/AperturaModal';
import { EgresoModal } from './pos/EgresoModal';
import { CierreModal } from './pos/CierreModal';
import { HistorialModal } from './pos/HistorialModal';
import { ExchangeReturnModal } from './pos/ExchangeReturnModal';
import { usePOSHotkeys } from '../hooks/usePOSHotkeys';


interface POSViewProps {
  selectedBranchId: string;
  activeSession: any;
  setActiveSession: (session: any) => void;
  localExpenses: any[];
  setLocalExpenses: React.Dispatch<React.SetStateAction<any[]>>;
}

interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantSku: string;
  combinationText: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  maxStock: number;
  discountType?: 'PERCENTAGE' | 'AMOUNT';
  discountRate?: number;
  discountAmount?: number;
}

export const POSView: React.FC<POSViewProps> = ({
  selectedBranchId,
  activeSession,
  setActiveSession,
  localExpenses,
  setLocalExpenses
}) => {
  const { branches } = useBranches();
  const { customers } = useCustomers();
  const { details: sessionDetails } = useCashSessionDetailsQuery(activeSession?.id || null);

  // Search input selection
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const paymentAmountInputRef = useRef<HTMLInputElement>(null);


  const { openSession, isOpening } = useOpenCashSession();
  const { closeSession, isClosing } = useCloseCashSession();
  const { registerExpense: apiRegisterExpense, isRegistering } = useRegisterExpense();
  const { processSale, isProcessing } = useProcessSale();

  // Session Balance & Expense Form fields
  const [openingBalance, setOpeningBalance] = useState('1000.00');
  const [closingBalance, setClosingBalance] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const expenseCategory = 'Servicios';

  // Modal Visibility states
  const [isAperturaModalOpen, setIsAperturaModalOpen] = useState(false);
  const [isEgresoModalOpen, setIsEgresoModalOpen] = useState(false);
  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
  const [isExchangeReturnModalOpen, setIsExchangeReturnModalOpen] = useState(false);

  // Cart States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Global Discount States
  const [globalDiscountType] = useState<'PERCENTAGE' | 'AMOUNT'>('PERCENTAGE');
  const [globalDiscountRate, setGlobalDiscountRate] = useState<number>(0);

  // Payment states (previously in PaymentModal)
  const [addedPayments, setAddedPayments] = useState<{ paymentMethod: PaymentMethod; amount: number }[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(PaymentMethod.EFECTIVO);
  const [customAmountText, setCustomAmountText] = useState('');

  // Ticket Printing State
  const [lastCompletedSale, setLastCompletedSale] = useState<any | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [reprintSaleData, setReprintSaleData] = useState<any | null>(null);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
  const [closingSessionToPrint, setClosingSessionToPrint] = useState<any | null>(null);
  const [isClosingTicketOpen, setIsClosingTicketOpen] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [selectedImageForZoom, setSelectedImageForZoom] = useState<string | null>(null);

  const currentUser = useAuthStore((state) => state.user);
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';

  useEffect(() => {
    apiClient.request('/tenants/current')
      .then((t) => setCurrentTenant(t))
      .catch((e) => console.error('Error fetching tenant details for ticket:', e));
  }, []);

  const handlePrintSale = (sale: Sale | SessionSale) => {
    const branchName = ('branch' in sale && sale.branch?.name) ? sale.branch.name : (branches.find((b) => b.id === selectedBranchId)?.name || 'Sucursal General');
    const branchAddress = ('branch' in sale && sale.branch?.address) ? sale.branch.address : (branches.find((b) => b.id === selectedBranchId)?.address || '');
    const clientName = sale.customer?.name || 'Consumidor Final';
    const clientIdentity = ('customer' in sale && sale.customer && 'identityNumber' in sale.customer) ? (sale.customer as any).identityNumber : '9999999999';
    const invoiceNumber = sale.invoiceNumber;

    setReprintSaleData({
      invoiceNumber,
      createdAt: sale.createdAt,
      branchName,
      branchAddress,
      clientName,
      clientIdentity,
      items: (sale.items || []).map((item: any) => ({
        variantId: item.variantId,
        variantSku: item.variant?.sku || item.sku || item.variantSku || '',
        productName: item.variant?.product?.name || item.productName || item.variantName || 'Producto',
        combinationText: item.variant?.attributeValues?.map((av: any) => av.value).join(' / ') || item.attributes || 'Estándar',
        quantity: Number(item.quantity),
        price: Number(item.price),
        discountAmount: Number(item.discountAmount || 0),
      })),
      paymentMethod: (sale.payments?.[0]?.paymentMethod || ('paymentMethod' in sale ? (sale as any).paymentMethod : undefined) || PaymentMethod.EFECTIVO) as any,
      discountAmount: Number((sale as any).discountAmount || 0),
      total: Number(sale.total || 0),
      userName: sale.user?.name || 'Vendedor',
    });
    setIsReprintModalOpen(true);
  };


  // Clock & shift timer
  const [currentTime, setCurrentTime] = useState('');
  const [shiftDuration, setShiftDuration] = useState('00h 00m 00s');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = DateTime.now().setZone(timezone);
      setCurrentTime(now.toFormat('HH:mm:ss'));

      if (activeSession && activeSession.createdAt) {
        const openedAt = DateTime.fromISO(activeSession.createdAt).setZone(timezone);
        if (openedAt.isValid) {
          const diff = now.diff(openedAt, ['hours', 'minutes', 'seconds']);
          const diffHrs = Math.floor(diff.hours);
          const diffMins = Math.floor(diff.minutes);
          const diffSecs = Math.floor(diff.seconds);
          setShiftDuration(`${diffHrs}h ${diffMins}m ${diffSecs}s`);
        } else {
          setShiftDuration('00h 00m 00s');
        }
      } else {
        setShiftDuration('00h 00m 00s');
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession, timezone]);

  // Pre-select CONSUMIDOR FINAL by default
  useEffect(() => {
    if (customers && customers.length > 0 && !selectedCustomerId) {
      const defaultCust = customers.find(
        (c: any) =>
          c.name.toUpperCase() === 'CONSUMIDOR FINAL' ||
          c.identityNumber === '9999999999999' ||
          c.identityNumber === '9999999999'
      );
      if (defaultCust) {
        setSelectedCustomerId(defaultCust.id);
      }
    }
  }, [customers, selectedCustomerId]);

  // Global hotkeys hook integration
  usePOSHotkeys({
    onSearchFocus: () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select();
      }
    },
    onPaymentFocus: () => {
      if (paymentAmountInputRef.current) {
        paymentAmountInputRef.current.focus();
        paymentAmountInputRef.current.select();
      }
    },
    onCompletePayment: () => {
      handleCompletePayment();
    },
  });

  const activeSessionSales = useMemo<SessionSale[]>(() => {
    if (!activeSession || !sessionDetails) return [];
    return sessionDetails.sales || [];
  }, [sessionDetails, activeSession]);

  const activeSessionExpenses = useMemo<SessionExpense[]>(() => {
    if (!activeSession || !sessionDetails) return [];
    return sessionDetails.expenses || [];
  }, [sessionDetails, activeSession]);

  const activeSessionRefunds = useMemo<SessionRefund[]>(() => {
    if (!activeSession || !sessionDetails) return [];
    return sessionDetails.refunds || [];
  }, [sessionDetails, activeSession]);

  const handleOpenSession = async () => {
    const branch = selectedBranchId || (branches[0] && branches[0].id);
    if (!branch) {
      toast.warning('Por favor selecciona una sucursal activa.');
      return;
    }
    try {
      const res = await openSession({
        branchId: branch,
        openingBalance: parseFloat(openingBalance),
      });
      setActiveSession(res);
      setIsAperturaModalOpen(false);
      toast.success('¡Caja registradora abierta con éxito!');
    } catch (err: any) {
      toast.error(err.message || 'Error al abrir la caja.');
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;

    // Validación: verificar que no esté vacío, sea numérico y no negativo
    const parsedClosing = parseFloat(closingBalance);
    if (
      closingBalance === '' ||
      closingBalance === null ||
      closingBalance === undefined ||
      isNaN(parsedClosing) ||
      parsedClosing < 0
    ) {
      toast.error('Debes ingresar el monto de efectivo físico para cerrar la caja.');
      return;
    }
    try {
      const openingBalance = Number(activeSession.openingBalance);
      const salesTotal = activeSessionSales.reduce((sum, s) => sum + Number(s.total), 0);
      const expensesTotal = activeSessionExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const refundsTotal = activeSessionRefunds.reduce((sum, r) => sum + Number(r.totalRefunded), 0);
      const expectedBalance = openingBalance + salesTotal - expensesTotal - refundsTotal;

      // Group products sold
      const productsSummary: Record<string, { name: string; quantity: number; total: number }> = {};
      activeSessionSales.forEach((sale) => {
        sale.items.forEach((item) => {
          const sku = item.variant.sku;
          const prodName = item.variant.product.name;
          const variantAttrs = (item.variant.attributeValues || [])
            .map((av) => av.value)
            .filter(Boolean)
            .join(' · ');
          const fullName = variantAttrs ? `${prodName} (${variantAttrs})` : prodName;

          if (!productsSummary[sku]) {
            productsSummary[sku] = {
              name: fullName,
              quantity: 0,
              total: 0,
            };
          }
          productsSummary[sku].quantity += Number(item.quantity);
          const itemDiscount = Number(item.discountAmount || 0);
          productsSummary[sku].total += (Number(item.price) - itemDiscount) * Number(item.quantity);
        });
      });

      const productsList = Object.entries(productsSummary).map(([sku, data]) => ({
        sku,
        ...data,
      }));

      // Group payments by method
      const paymentsBreakdown: Record<string, number> = {};
      activeSessionSales.forEach((sale) => {
        (sale.payments || []).forEach((p) => {
          const method = p.paymentMethod || sale.paymentMethod;
          paymentsBreakdown[method] = (paymentsBreakdown[method] || 0) + Number(p.amount);
        });
      });

      // Get refunds from activeSessionRefunds
      const refundsList = activeSessionRefunds.map((ref) => ({
        id: ref.id,
        reason: ref.reason,
        items: ref.items.map((ri) => ({
          name: ri.variant.product.name,
          sku: ri.variant.sku,
          quantity: ri.quantity,
        })),
      }));

      const salesList = activeSessionSales.map((s) => ({
        invoiceNumber: s.invoiceNumber,
        createdAt: s.createdAt,
        total: Number(s.total),
        paymentMethods: (s.payments || []).map((p) => p.paymentMethod),
      }));

      const dataToPrint = {
        id: activeSession.id,
        openedAt: activeSession.openedAt,
        closedAt: new Date().toISOString(),
        openingBalance,
        closingBalance: parseFloat(closingBalance) || 0,
        expectedBalance,
        salesTotal,
        expensesTotal,
        expensesList: activeSessionExpenses.map((e) => ({
          description: e.description,
          amount: Number(e.amount),
          createdAt: e.createdAt,
        })),
        productsList,
        paymentsBreakdown,
        refundsList,
        salesList,
        userName: currentUser?.name || 'Vendedor',
        branchName: branches.find((b: any) => b.id === selectedBranchId)?.name || 'Principal',
        branchAddress: branches.find((b: any) => b.id === selectedBranchId)?.address || '',
      };

      await closeSession({
        id: activeSession.id,
        closingBalance: parseFloat(closingBalance) || 0,
      });

      setActiveSession(null);
      setLocalExpenses([]);
      setIsCierreModalOpen(false);

      setClosingSessionToPrint(dataToPrint);
      setIsClosingTicketOpen(true);

      toast.success('¡Sesión de caja cerrada con éxito!');
    } catch (err: any) {
      toast.error(err.message || 'Error al cerrar la caja.');
    }
  };

  const handleAddExpense = async () => {
    const branch = selectedBranchId || (branches[0] && branches[0].id);
    if (!branch) return;
    if (!expenseDesc.trim()) {
      toast.warning('Por favor ingresa una descripción para el gasto.');
      return;
    }
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      toast.warning('Por favor ingresa un monto válido.');
      return;
    }
    try {
      await apiRegisterExpense({
        branchId: branch,
        cashSessionId: activeSession?.id,
        description: expenseDesc.trim(),
        amount: parseFloat(expenseAmount),
        category: expenseCategory
      });
      setLocalExpenses([...localExpenses, {
        id: Math.random().toString(),
        desc: expenseDesc.trim(),
        amount: parseFloat(expenseAmount),
        category: expenseCategory
      }]);
      setExpenseDesc('');
      setExpenseAmount('');
      setIsEgresoModalOpen(false);
      toast.success('¡Gasto registrado con éxito!');
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar el gasto.');
    }
  };

  const handleUpdateItemDiscount = (variantId: string, type: 'PERCENTAGE' | 'AMOUNT', inputVal: number) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.variantId !== variantId) return item;

      let val = Number(inputVal.toFixed(2));
      if (isNaN(val) || val < 0) {
        val = 0;
      }

      let calculatedAmount = 0;
      let displayRate = val;

      if (type === 'PERCENTAGE') {
        if (val > 100) {
          val = 100;
          displayRate = 100;
          toast.warning('El descuento por producto no puede superar el 100%');
        }
        calculatedAmount = Number(((item.price * val) / 100).toFixed(2));
      } else {
        // En modo AMOUNT (Moneda), el inputVal representa el PRECIO FINAL de venta.
        // Si el precio de venta es mayor al precio original, no aplicamos descuento.
        if (val > item.price) {
          val = item.price;
          displayRate = item.price;
          toast.warning(`El precio de venta no puede superar el precio original del producto ($${item.price.toFixed(2)})`);
        }
        // El descuento real (calculatedAmount) es el precio original menos el precio final deseado.
        calculatedAmount = Number((item.price - val).toFixed(2));
      }
      calculatedAmount = Math.max(0, Math.min(item.price, calculatedAmount));

      return {
        ...item,
        discountType: type,
        discountRate: displayRate, // guardamos el valor ingresado para que se muestre correctamente en el input
        discountAmount: calculatedAmount // este es el descuento total restado al precio unitario
      };
    }));
  };

  const handleSetGlobalDiscountRate = (rate: number) => {
    let finalRate = Number(rate.toFixed(2));
    if (isNaN(finalRate) || finalRate < 0) {
      finalRate = 0;
    }

    if (globalDiscountType === 'PERCENTAGE') {
      if (finalRate > 100) {
        finalRate = 100;
        toast.warning('El descuento global no puede superar el 100%');
      }
    } else {
      if (finalRate > netSubtotal) {
        finalRate = netSubtotal;
        toast.warning(`El descuento global no puede superar el subtotal neto ($${netSubtotal.toFixed(2)})`);
      }
    }
    setGlobalDiscountRate(finalRate);
  };

  const addVariantToCart = (product: any, variant: any, maxStock: number) => {
    const existing = cart.find(item => item.variantId === variant.id);

    if (existing) {
      const newQty = existing.quantity + 1;
      if (newQty > maxStock) {
        toast.warning(`Aviso: El stock del producto "${product.name}" quedará en negativo (Stock disponible: ${maxStock} pzs.)`);
      }
      setCart(cart.map(item =>
        item.variantId === variant.id
          ? { ...item, quantity: newQty }
          : item
      ));
    } else {
      const combText = variant.attributeValues && variant.attributeValues.length > 0
        ? variant.attributeValues.map((av: any) => `${av.attribute?.name || 'Attr'}: ${av.value}`).join(' / ')
        : 'Estándar';

      const imageUrl = variant.imageUrl

      if (1 > maxStock) {
        toast.warning(`Aviso: El stock del producto "${product.name}" quedará en negativo (Stock disponible: ${maxStock} pzs.)`);
      }

      setCart([...cart, {
        variantId: variant.id,
        productId: product.id,
        productName: product.name,
        variantSku: variant.sku,
        combinationText: combText,
        price: variant.salePrice || 0,
        quantity: 1,
        imageUrl,
        maxStock,
        discountType: 'PERCENTAGE',
        discountRate: 0,
        discountAmount: 0
      }]);
    }
    toast.success(`Se agregó al carrito: ${product.name} ${variant.sku}`);
  };

  const handleUpdateCartQty = (variantId: string, delta: number) => {
    const item = cart.find(i => i.variantId === variantId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter(i => i.variantId !== variantId));
      toast.info('Item removido del carrito.');
      return;
    }

    if (newQty > item.maxStock && delta > 0) {
      toast.warning(`Aviso: El stock del producto "${item.productName}" quedará en negativo (Stock disponible: ${item.maxStock} pzs.)`);
    }

    setCart(cart.map(i => i.variantId === variantId ? { ...i, quantity: newQty } : i));
  };

  const handleRemoveFromCart = (variantId: string) => {
    setCart(cart.filter(i => i.variantId !== variantId));
    toast.info('Item removido del carrito.');
  };

  const handleSearchKeyPress = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = searchTerm.trim();
      if (!code) return;

      try {
        const branch = selectedBranchId || (branches[0] && branches[0].id);
        const res = await productsService.getPosVariantBySku(code, branch);
        if (res && res.length > 0) {
          if (res.length === 1) {
            const singleRes = res[0];
            const fakeProduct = {
              id: singleRes.id,
              name: singleRes.productName,
            };
            const fakeVariant = {
              id: singleRes.id,
              sku: singleRes.sku,
              salePrice: Number(singleRes.salePrice || 0),
              attributeValues: singleRes.attributeValues || [],
              imageUrl: singleRes.imageUrl,
            };
            const stockQty = Number(singleRes.stock || 0);
            if (stockQty <= 0) {
              toast.warning(`Aviso: El stock del producto "${singleRes.productName}" quedará en negativo (Stock disponible: ${stockQty} pzs.)`);
            }
            addVariantToCart(fakeProduct, fakeVariant, stockQty);
            setSearchTerm('');
          } else {
            // Múltiples elementos encontrados
            setSearchResults(res);
            setShowSearchModal(true);
          }
        } else {
          toast.error(`No se encontró ningún producto con el código: "${code}"`);
        }
      } catch (err) {
        toast.error(`No se encontró ningún producto con el código: "${code}"`);
      }
    }
  };

  const grossSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const totalItemDiscounts = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.discountAmount || 0) * item.quantity, 0);
  }, [cart]);

  const netSubtotal = useMemo(() => {
    return Number((grossSubtotal - totalItemDiscounts).toFixed(2));
  }, [grossSubtotal, totalItemDiscounts]);

  const globalDiscountAmount = useMemo(() => {
    let amount = 0;
    if (globalDiscountType === 'PERCENTAGE') {
      amount = Number(((netSubtotal * globalDiscountRate) / 100).toFixed(2));
    } else {
      amount = globalDiscountRate;
    }
    return Math.min(netSubtotal, amount);
  }, [netSubtotal, globalDiscountType, globalDiscountRate]);

  const cartTotal = useMemo(() => {
    return Number((netSubtotal - globalDiscountAmount).toFixed(2));
  }, [netSubtotal, globalDiscountAmount]);

  const amountPaid = useMemo(() => {
    return Number(addedPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2));
  }, [addedPayments]);

  const remaining = useMemo(() => {
    return Math.max(0, Number((cartTotal - amountPaid).toFixed(2)));
  }, [cartTotal, amountPaid]);

  const handleAddPayment = (amount?: number) => {
    const targetAmt = amount !== undefined ? amount : parseFloat(customAmountText);
    if (isNaN(targetAmt) || targetAmt <= 0) {
      toast.warning('Ingresa un monto de pago válido.');
      return;
    }

    if (remaining <= 0) {
      toast.warning('La venta ya está totalmente pagada.');
      return;
    }

    setAddedPayments([...addedPayments, { paymentMethod: selectedMethod, amount: Number(targetAmt.toFixed(2)) }]);
    setCustomAmountText('');
  };

  const handleRemovePayment = (index: number) => {
    setAddedPayments(addedPayments.filter((_, idx) => idx !== index));
  };

  const getMethodDetails = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.EFECTIVO:
        return { label: 'Efectivo', sub: 'Cash', icon: Banknote, colorClass: 'text-emerald-500 bg-emerald-500/10' };
      case PaymentMethod.TARJETA:
        return { label: 'Tarjeta', sub: 'Card', icon: CreditCard, colorClass: 'text-blue-500 bg-blue-500/10' };
      default:
        return { label: method, sub: 'Payment', icon: Banknote, colorClass: 'text-neutral bg-neutral/10' };
    }
  };

  const handleCompletePayment = async () => {
    const branch = selectedBranchId || (branches[0] && branches[0].id);
    if (!branch || !activeSession || cart.length === 0) return;

    if (amountPaid < cartTotal) {
      toast.warning(`Falta cubrir $${remaining.toFixed(2)} del total para poder procesar la venta.`);
      return;
    }

    const branchName = branches.find((b: any) => b.id === branch)?.name || 'Sucursal General';

    // Normalize payments for multiple/split payment methods so the exact net total is recorded in DB
    let remainingBudget = cartTotal;
    const normalizedPayments: { paymentMethod: PaymentMethod; amount: number; referenceNumber?: string }[] = [];

    // 1. Prioritize non-cash payments (e.g. Tarjeta, Transferencia) which cannot exceed required amount
    for (const p of addedPayments) {
      if (p.paymentMethod !== PaymentMethod.EFECTIVO && remainingBudget > 0) {
        const allowed = Math.min(p.amount, remainingBudget);
        if (allowed > 0) {
          normalizedPayments.push({ ...p, amount: Number(allowed.toFixed(2)) });
          remainingBudget = Number((remainingBudget - allowed).toFixed(2));
        }
      }
    }

    // 2. Allocate cash payments up to the remaining balance (ignoring extra tendered cash returned as change)
    for (const p of addedPayments) {
      if (p.paymentMethod === PaymentMethod.EFECTIVO && remainingBudget > 0) {
        const allowed = Math.min(p.amount, remainingBudget);
        if (allowed > 0) {
          normalizedPayments.push({ ...p, amount: Number(allowed.toFixed(2)) });
          remainingBudget = Number((remainingBudget - allowed).toFixed(2));
        }
      }
    }

    try {
      const res = await processSale({
        branchId: branch,
        cashSessionId: activeSession.id,
        customerId: selectedCustomerId || undefined,
        discountType: globalDiscountType,
        discountRate: globalDiscountRate,
        discountAmount: globalDiscountAmount,
        items: cart.map(i => ({
          variantId: i.variantId,
          quantity: i.quantity,
          price: i.price,
          discountType: i.discountType,
          discountRate: i.discountRate,
          discountAmount: i.discountAmount
        })),
        payments: normalizedPayments
      });

      const change = amountPaid - cartTotal;
      if (change > 0) {
        toast.info(`Cambio a entregar al cliente: $${change.toFixed(2)}`, { duration: 8000 });
      }

      const clientName = customers.find((c: any) => c.id === selectedCustomerId)?.name || 'Consumidor Final';
      const clientIdentity = customers.find((c: any) => c.id === selectedCustomerId)?.identityNumber || '9999999999';

      const saleDataForTicket = {
        invoiceNumber: res.invoiceNumber,
        createdAt: res.createdAt || new Date().toISOString(),
        branchName,
        branchAddress: branches.find((b: any) => b.id === branch)?.address || '',
        clientName,
        clientIdentity,
        items: cart.map(i => ({
          variantId: i.variantId,
          variantSku: i.variantSku || '',
          productName: i.productName,
          combinationText: i.combinationText,
          quantity: i.quantity,
          price: i.price,
          discountAmount: i.discountAmount || 0
        })),
        paymentMethod: addedPayments[0]?.paymentMethod || PaymentMethod.EFECTIVO,
        discountAmount: globalDiscountAmount,
        total: cartTotal,
        userName: currentUser?.name || 'Vendedor'
      };

      setLastCompletedSale(saleDataForTicket);
      setCart([]);
      setAddedPayments([]);
      setSelectedCustomerId('');
      setGlobalDiscountRate(0);

      setIsTicketModalOpen(true);
      toast.success('¡Venta procesada con éxito y cargada en Kardex!');
    } catch (err: any) {
      toast.error(err.message || 'Error al procesar la venta.');
      throw err;
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 lg:h-[calc(100vh-7rem)] lg:overflow-hidden">

      {/* Premium POS Next Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-bg-card border border-border-card rounded-2xl p-4 shadow-sm">
        {/* Digital Clock & Shift Open Status */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs text-secondary font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>{currentTime}</span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-semibold ${activeSession
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${activeSession ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>
              {activeSession ? `Caja Abierta: ${shiftDuration}` : 'Caja Cerrada'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {activeSession ? (
            <>
              <button
                onClick={() => setIsEgresoModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs font-semibold text-secondary hover:border-amber-500/30 hover:text-amber-500 transition-all cursor-pointer shadow-sm"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
                <span>Registrar Gasto</span>
              </button>

              <button
                onClick={() => setIsHistorialModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs font-semibold text-secondary hover:border-primary/30 hover:text-primary transition-all cursor-pointer shadow-sm"
              >
                <Receipt className="w-3.5 h-3.5 text-primary" />
                <span>Historial</span>
              </button>

              <button
                onClick={() => setIsExchangeReturnModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs font-semibold text-secondary hover:border-indigo-500/30 hover:text-indigo-400 transition-all cursor-pointer shadow-sm"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400" />
                <span>Cambios</span>
              </button>

              <button
                onClick={() => setIsCierreModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/20 transition-all cursor-pointer shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cerrar Caja</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsAperturaModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-semibold text-emerald-500 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-sm"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Apertura de Caja</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid min-h-0 grid-cols-1 lg:flex-1 lg:grid-cols-5 gap-6 relative items-stretch">

        {/* LEFT COLUMN: Barcode scan input & cart products list (3/5 width) */}
        <div className="lg:col-span-3 min-h-0 space-y-4 bg-bg-card border border-border-card rounded-2xl p-5 shadow-sm flex flex-col">

          {/* Barcode Search Header with Shift menu */}
          <div className="flex gap-3 items-center justify-between border-b border-border-card pb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Escanea código de barras o busca por SKU/Nombre y presiona Enter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                className="w-full bg-bg-dark border border-border-card rounded-xl py-2 pl-10 pr-4 text-xs text-secondary focus:outline-none focus:border-primary transition-all placeholder-neutral"
                autoFocus
              />
            </div>
          </div>

          {/* Cart Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <span>Lista de Compra</span>
            </h3>
            {cart.length > 0 && (
              <button
                onClick={() => { setCart([]); setAddedPayments([]); toast.info('Carrito vaciado.'); }}
                className="text-[10px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar Carrito</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <div className="h-80 border-2 border-dashed border-border-card rounded-xl flex flex-col items-center justify-center gap-1.5 text-center p-4">
              <ShoppingCart className="w-8 h-8 opacity-25 text-neutral" />
              <span className="text-[10px] text-neutral">No hay artículos cargados. Escanea un código de barras o escribe su SKU/Nombre arriba.</span>
            </div>
          ) : (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {cart.map((item) => {
                const currentItemDiscountType = item.discountType || 'PERCENTAGE';
                const currentItemDiscountRate = item.discountRate || 0;
                const currentItemDiscountAmount = item.discountAmount || 0;
                const lineTotal = (item.price - currentItemDiscountAmount) * item.quantity;

                return (
                  <div 
                    key={item.variantId} 
                    className="bg-bg-dark/40 border border-border-card/60 rounded-xl p-2.5 flex items-center gap-3 hover:border-primary/30 transition-all duration-150 group animate-fade-in"
                  >
                    {/* Thumbnail matching exact height */}
                    <div
                      onClick={() => {
                        if (item.imageUrl) {
                          setSelectedImageForZoom(item.imageUrl);
                        }
                      }}
                      className={`w-14 h-14 bg-bg-card border border-border-card/50 rounded-lg overflow-hidden shrink-0 flex items-center justify-center relative group/thumb transition-all ${
                        item.imageUrl ? 'cursor-pointer hover:border-primary/50' : ''
                      }`}
                    >
                      {item.imageUrl ? (
                        <>
                          <img src={item.imageUrl} className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200" alt="mini" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-all duration-200">
                            <Maximize2 className="w-4 h-4 text-white" />
                          </div>
                        </>
                      ) : (
                        <Package className="w-6 h-6 text-neutral opacity-30" />
                      )}
                    </div>

                    {/* Product Info (Center-Left) */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h5 className="text-[11.5px] font-extrabold text-secondary truncate leading-tight">
                        {item.productName}
                      </h5>
                      <div className="flex items-center gap-2 mt-1 text-[9.5px] text-neutral flex-wrap">
                        <span className="font-mono font-bold text-[10.5px] text-primary/95 bg-primary/10 border border-primary/25 px-1.5 py-0.5 rounded tracking-wide shadow-2xs truncate max-w-[130px]">
                          {item.variantSku || 'S/SKU'}
                        </span>
                        <span className="text-border-card font-bold">·</span>
                        <span className="font-bold text-foreground font-mono text-[10.5px]">
                          ${item.price.toFixed(2)}
                        </span>
                        {item.maxStock <= 0 ? (
                          <Badge variant="destructive" className="text-[8px] h-3.5 px-1 leading-none font-extrabold">
                            Stock: {item.maxStock}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[8px] h-3.5 px-1 leading-none font-extrabold text-neutral border-neutral/30 bg-neutral/10">
                            Stock: {item.maxStock}
                          </Badge>
                        )}
                        {currentItemDiscountAmount > 0 && (
                          <Badge variant="secondary" className="text-[8px] h-3.5 px-1 leading-none font-extrabold bg-emerald-500/10 text-emerald-500 border-none">
                            Desc. -${currentItemDiscountAmount.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Cashier Controls (Right) */}
                    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                      {/* Quantity Selector */}
                      <div className="flex items-center bg-bg-card border border-border-card/70 rounded-lg h-7 p-0.5 shadow-xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(item.variantId, -1)}
                          className="w-5 h-5 flex items-center justify-center hover:bg-bg-dark text-neutral hover:text-secondary rounded transition-colors cursor-pointer"
                          title="Disminuir cantidad"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="text-[10.5px] font-mono font-bold px-1.5 min-w-[20px] text-center text-secondary">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(item.variantId, 1)}
                          className="w-5 h-5 flex items-center justify-center hover:bg-bg-dark text-neutral hover:text-secondary rounded transition-colors cursor-pointer"
                          title="Aumentar cantidad"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      {/* Compact Discount Pill */}
                      <div 
                        className="flex items-center bg-bg-card border border-border-card/70 rounded-lg h-7 px-1 shadow-xs"
                        title={currentItemDiscountType === 'PERCENTAGE' ? 'Descuento (%)' : 'Precio Especial ($)'}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            const nextType = currentItemDiscountType === 'PERCENTAGE' ? 'AMOUNT' : 'PERCENTAGE';
                            const nextValue = nextType === 'AMOUNT' ? item.price : 0;
                            handleUpdateItemDiscount(item.variantId, nextType, nextValue);
                          }}
                          className="w-5 h-5 rounded flex items-center justify-center text-neutral hover:text-secondary hover:bg-bg-dark transition-colors cursor-pointer shrink-0"
                          title={currentItemDiscountType === 'PERCENTAGE' ? 'Cambiar a Precio Fijo ($)' : 'Cambiar a Porcentaje (%)'}
                        >
                          {currentItemDiscountType === 'PERCENTAGE' ? (
                            <Percent className="w-2.5 h-2.5 text-blue-400 font-bold" />
                          ) : (
                            <DollarSign className="w-2.5 h-2.5 text-emerald-400 font-bold" />
                          )}
                        </button>
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          step={currentItemDiscountType === 'PERCENTAGE' ? "1" : "0.01"}
                          value={currentItemDiscountRate === 0 ? '' : currentItemDiscountRate}
                          onChange={(e) => {
                            const val = Math.max(0, parseFloat(e.target.value) || 0);
                            handleUpdateItemDiscount(item.variantId, currentItemDiscountType, val);
                          }}
                          className="w-11 h-6 text-[10.5px] font-mono text-right bg-transparent text-secondary focus:outline-none pr-0.5"
                        />
                      </div>

                      {/* Total Price for line */}
                      <div className="text-right min-w-[65px]">
                        <span className="text-xs sm:text-[13px] font-extrabold text-foreground font-mono block leading-tight">
                          ${lineTotal.toFixed(2)}
                        </span>
                        {currentItemDiscountAmount > 0 && (
                          <span className="text-[8.5px] font-mono text-emerald-400 block leading-tight">
                            -${(currentItemDiscountAmount * item.quantity).toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Remove item button */}
                      <button
                        onClick={() => handleRemoveFromCart(item.variantId)}
                        className="w-6 h-6 flex items-center justify-center text-neutral hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer shrink-0"
                        title="Eliminar item"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Payments details, client selector, total breakdown (2/5 width) */}
        <div className="lg:col-span-2 min-h-0 flex flex-col overflow-hidden bg-bg-card border border-border-card rounded-2xl p-4 shadow-sm">
          <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto -mr-2 pr-2">

            <h3 className="text-[11px] font-bold text-secondary uppercase tracking-wider border-b border-border-card pb-2">
              Detalles de Pago y Cierre
            </h3>

            {/* Customer & Discount Compact Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_88px] gap-2 items-end">
              {/* Customer selector (Shadcn Combobox with integrated search) */}
              <div className="space-y-1 min-w-0">
                <span className="text-[9px] font-bold text-neutral uppercase tracking-wider block">
                  Cliente Facturación
                </span>
                <Combobox
                  items={customers}
                  value={customers.find(c => c.id === selectedCustomerId) || null}
                  onValueChange={(val: any) => setSelectedCustomerId(val?.id || '')}
                >
                  <ComboboxTrigger
                    render={
                      <Button
                        variant="outline"
                        className="w-full justify-between font-normal bg-bg-dark border-border-card text-xs text-secondary rounded-lg py-1 px-2.5 h-8 hover:bg-bg-dark/80 hover:text-secondary flex items-center"
                      >
                        {(() => {
                          const activeCust = customers.find(c => c.id === selectedCustomerId);
                          return activeCust ? (
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold text-[11px] text-secondary truncate">{activeCust.name}</span>
                              <span className="text-[9px] text-neutral-400 font-mono shrink-0">({activeCust.identityNumber})</span>
                            </div>
                          ) : (
                            <span className="text-neutral text-[10.5px]">Seleccionar cliente...</span>
                          );
                        })()}
                      </Button>
                    }
                  />
                  <ComboboxContent className="bg-bg-card border border-border-card rounded-xl shadow-2xl z-30 w-72 max-h-60 overflow-y-auto">
                    <ComboboxInput
                      showTrigger={false}
                      placeholder="Buscar por nombre o cédula..."
                      className="w-full border-b border-border-card bg-transparent px-3 py-2 text-xs text-secondary focus:outline-none placeholder-neutral"
                    />
                    <ComboboxEmpty className="p-3 text-center text-xs text-neutral">
                      No se encontraron clientes
                    </ComboboxEmpty>
                    <ComboboxList>
                      {(c: any) => (
                        <ComboboxItem
                          key={c.id}
                          value={c}
                          className="px-3 py-1.5 hover:bg-bg-dark text-xs text-secondary rounded-lg transition-colors cursor-pointer flex flex-col items-start gap-0.5"
                        >
                          <span className="font-bold text-[11px] text-secondary">{c.name}</span>
                          <span className="text-[9.5px] text-neutral font-mono">{c.identityNumber}</span>
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>

              {/* Global Discount Block */}
              <div className="space-y-1 min-w-0">
                <div className="flex justify-between items-center text-[9px] font-bold text-neutral uppercase tracking-wider">
                  <span>Desc. (%)</span>
                  {globalDiscountAmount > 0 && (
                    <span className="text-emerald-400 font-mono font-bold">-${globalDiscountAmount.toFixed(2)}</span>
                  )}
                </div>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  max="100"
                  step="1"
                  value={globalDiscountRate === 0 ? '' : globalDiscountRate}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    handleSetGlobalDiscountRate(val);
                  }}
                  className="w-full h-8 rounded-lg py-1 px-2 text-xs text-secondary text-right font-mono bg-bg-dark border-border-card focus-visible:border-primary"
                />
              </div>

            </div>

            {/* Calculation Rows */}
            <div className="space-y-1 text-[11px] text-neutral border-t border-border-card/50 pt-2">
              <div className="flex justify-between items-center">
                <span>Cantidad de Artículos</span>
                <span className="font-bold text-secondary font-mono">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Subtotal Bruto</span>
                <span className="font-bold text-secondary font-mono">${grossSubtotal.toFixed(2)}</span>
              </div>
              {totalItemDiscounts > 0 && (
                <div className="flex justify-between items-center text-emerald-400 font-medium">
                  <span>Descuento por Ítem</span>
                  <span className="font-bold font-mono">-${totalItemDiscounts.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>Subtotal Neto</span>
                <span className="font-bold text-secondary font-mono">${netSubtotal.toFixed(2)}</span>
              </div>
              {globalDiscountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-400 font-medium">
                  <span>Descuento Global Venta</span>
                  <span className="font-bold font-mono">-${globalDiscountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* HIGHLIGHTED HERO TOTAL TO PAY */}
            <div className="bg-brand-secondary border border-brand-secondary-border rounded-2xl p-3 flex justify-between items-center shadow-xs">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-secondary-foreground block leading-tight">
                  Monto Total a Cobrar
                </span>
                <span className="text-[9.5px] text-zinc-600 font-medium">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} artículo(s)
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-brand-secondary-foreground font-mono tracking-tight leading-none">
                ${cartTotal.toFixed(2)}
              </span>
            </div>

            {/* Payment Section */}
            {cart.length > 0 && (
              <div className="border-t border-border-card/50 pt-2.5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9.5px] font-bold text-neutral uppercase tracking-wider">Cargar Pagos</span>
                  <div className="text-right flex items-center gap-1.5">
                    <span className="text-[9px] uppercase font-bold text-neutral">Por Pagar:</span>
                    <span className={`text-base font-black font-mono ${remaining <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      ${remaining <= 0 ? '0.00' : remaining.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Payment Selector and Input in a compact row */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddPayment();
                  }}
                  className="bg-bg-dark/40 border border-border-card/60 rounded-xl p-1.5 flex gap-1.5 items-center"
                >
                  <div className="w-[125px] shrink-0">
                    <Select
                      value={selectedMethod}
                      onValueChange={(val: any) => setSelectedMethod(val || PaymentMethod.EFECTIVO)}
                    >
                      <SelectTrigger
                        className="w-full justify-between font-normal bg-bg-dark border-border-card text-xs text-secondary rounded-lg py-1 px-2 h-8 hover:bg-bg-dark/80 hover:text-secondary flex items-center border"
                      >
                        {(() => {
                          const details = getMethodDetails(selectedMethod);
                          const Icon = details.icon;
                          return (
                            <div className="flex items-center gap-1.5 truncate">
                              <div className={`p-0.5 rounded ${details.colorClass} shrink-0`}>
                                <Icon className="w-3 h-3" />
                              </div>
                              <span className="font-bold text-[10.5px] text-secondary truncate">{details.label}</span>
                            </div>
                          );
                        })()}
                      </SelectTrigger>
                      <SelectContent className="bg-bg-card border border-border-card rounded-xl shadow-2xl z-30 w-[140px] max-h-60 overflow-y-auto p-1">
                        {Object.values(PaymentMethod).map((method) => {
                          const details = getMethodDetails(method);
                          const Icon = details.icon;
                          return (
                            <SelectItem
                              key={method}
                              value={method}
                              className="px-2 py-1 hover:bg-bg-dark text-xs text-secondary rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <div className={`p-0.5 rounded ${details.colorClass} shrink-0`}>
                                <Icon className="w-3 h-3" />
                              </div>
                              <span className="font-bold text-[10.5px] text-secondary">{details.label}</span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <input
                    ref={paymentAmountInputRef}
                    type="number"
                    placeholder="0.00"
                    min="0"
                    value={customAmountText}
                    onChange={(e) => setCustomAmountText(e.target.value)}
                    className="flex-1 min-w-0 h-8 bg-bg-dark border border-border-card rounded-lg py-1 px-2.5 text-xs text-secondary font-mono font-bold focus:outline-none focus:border-primary placeholder-neutral"
                  />
                  <button
                    type="submit"
                    className="h-8 px-3.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    Agregar
                  </button>
                </form>

                {/* Added Payments List */}
                {addedPayments.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-bold text-neutral uppercase tracking-wider">
                      <span>Pagos Registrados ({addedPayments.length})</span>
                      <span className="font-mono text-emerald-400 font-bold">Total: ${amountPaid.toFixed(2)}</span>
                    </div>
                    <div className="max-h-20 space-y-1 overflow-y-auto pr-1">
                      {addedPayments.map((p, idx) => {
                        const details = getMethodDetails(p.paymentMethod);
                        const Icon = details.icon;
                        return (
                          <div key={idx} className="flex items-center justify-between py-1 px-2 bg-bg-dark/40 border border-border-card/50 rounded-lg text-xs">
                            <div className="flex items-center gap-1.5">
                              <div className={`p-0.5 rounded ${details.colorClass}`}>
                                <Icon className="w-3 h-3" />
                              </div>
                              <span className="font-semibold text-[10.5px] text-secondary">{details.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-secondary font-mono text-[11px]">${p.amount.toFixed(2)}</span>
                              <button
                                type="button"
                                onClick={() => handleRemovePayment(idx)}
                                className="p-0.5 text-neutral hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cash change helper */}
                {amountPaid > cartTotal && (
                  <div className="p-2.5 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-xl flex justify-between items-center animate-fade-in shadow-xs">
                    <div>
                      <span className="text-[9.5px] uppercase font-black tracking-wider block">Vuelto / Cambio a entregar</span>
                      <span className="text-[8.5px] opacity-80 block">Entregar al cliente</span>
                    </div>
                    <span className="text-2xl font-mono font-black tracking-tight text-emerald-400">
                      ${(amountPaid - cartTotal).toFixed(2)}
                    </span>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* ACTION SUBMIT BUTTON */}
          <div className="shrink-0 border-t border-border-card/50 bg-bg-card pt-2.5">
            <button
              onClick={handleCompletePayment}
              disabled={!activeSession || cart.length === 0 || isProcessing || amountPaid < cartTotal}
              className="w-full py-2.5 bg-primary hover:bg-primary-hover disabled:bg-neutral/20 disabled:text-neutral/60 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Completar Venta</span>
            </button>
          </div>

        </div>

      </div>

      {/* Thermal Ticket Printer simulation */}
      <ThermalTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => {
          setIsTicketModalOpen(false);
          setLastCompletedSale(null);
        }}
        saleData={lastCompletedSale}
        tenantRuc={currentTenant?.ruc || ''}
        tenantName={currentTenant?.name || ''}
        currencyCode={currentTenant?.currencyCode || ''}
      />

      {/* Caja Chica Control modals */}
      <AperturaModal
        isOpen={isAperturaModalOpen}
        onClose={() => setIsAperturaModalOpen(false)}
        openingBalance={openingBalance}
        setOpeningBalance={setOpeningBalance}
        onOpenSession={handleOpenSession}
        isOpening={isOpening}
      />

      <EgresoModal
        isOpen={isEgresoModalOpen}
        onClose={() => setIsEgresoModalOpen(false)}
        expenseDesc={expenseDesc}
        setExpenseDesc={setExpenseDesc}
        expenseAmount={expenseAmount}
        setExpenseAmount={setExpenseAmount}
        onAddExpense={handleAddExpense}
        isRegistering={isRegistering}
      />

      <CierreModal
        isOpen={isCierreModalOpen}
        onClose={() => setIsCierreModalOpen(false)}
        closingBalance={closingBalance}
        setClosingBalance={setClosingBalance}
        onCloseSession={handleCloseSession}
        isClosing={isClosing}
        activeSession={activeSession}
        activeSessionSales={activeSessionSales}
        activeSessionExpenses={activeSessionExpenses}
        activeSessionRefunds={sessionDetails?.refunds || []}
      />

      {isHistorialModalOpen && (
        <HistorialModal
          isOpen={isHistorialModalOpen}
          onClose={() => setIsHistorialModalOpen(false)}
          activeSessionSales={activeSessionSales}
          activeSessionExpenses={activeSessionExpenses}
          activeSessionRefunds={sessionDetails?.refunds || []}
          activeSession={activeSession}
          branchId={selectedBranchId}
          onPrintSale={handlePrintSale}
        />
      )}

      <ThermalTicketModal
        isOpen={isReprintModalOpen}
        onClose={() => {
          setIsReprintModalOpen(false);
          setReprintSaleData(null);
        }}
        saleData={reprintSaleData}
        tenantRuc={currentTenant?.ruc || ''}
        tenantName={currentTenant?.name || ''}
        currencyCode={currentTenant?.currencyCode || ''}
      />

      <ThermalClosingTicketModal
        isOpen={isClosingTicketOpen}
        onClose={() => {
          setIsClosingTicketOpen(false);
          setClosingSessionToPrint(null);
        }}
        sessionData={closingSessionToPrint}
        tenantRuc={currentTenant?.ruc || ''}
        tenantName={currentTenant?.name || ''}
      />

      {isExchangeReturnModalOpen && (
        <ExchangeReturnModal
          isOpen={isExchangeReturnModalOpen}
          onClose={() => setIsExchangeReturnModalOpen(false)}
          activeSession={activeSession}
          branchId={selectedBranchId}
          cashSessionId={activeSession?.id || ''}
        />
      )}

      {selectedImageForZoom && (
        <Dialog open={!!selectedImageForZoom} onOpenChange={() => setSelectedImageForZoom(null)}>
          <DialogContent className="max-w-5xl w-full bg-bg-card border border-border-card p-6 pt-12 rounded-2xl flex flex-col items-center overflow-hidden shadow-2xl z-[60]">
            <div className="relative w-full max-h-[75vh] rounded-xl overflow-hidden bg-bg-dark flex items-center justify-center">
              <img src={selectedImageForZoom} className="max-w-full max-h-[75vh] object-contain" alt="Producto ampliado" />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showSearchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card border border-border-card rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="p-4 border-b border-border-card flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-secondary">Múltiples coincidencias encontradas</h3>
                <p className="text-[10px] text-neutral mt-0.5">Selecciona el producto que deseas agregar al carrito</p>
              </div>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchResults([]);
                }}
                className="p-1.5 hover:bg-bg-dark rounded-xl text-neutral hover:text-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List */}
            <div className="p-3 overflow-y-auto space-y-2 flex-1">
              {searchResults.map((variant) => {
                const stockQty = Number(variant.stock || 0);
                const hasAttributes = variant.attributeValues && variant.attributeValues.length > 0;
                
                return (
                  <div
                    key={variant.id}
                    onClick={() => {
                      const fakeProduct = {
                        id: variant.id,
                        name: variant.productName,
                      };
                      const fakeVariant = {
                        id: variant.id,
                        sku: variant.sku,
                        salePrice: Number(variant.salePrice || 0),
                        attributeValues: variant.attributeValues || [],
                        imageUrl: variant.imageUrl,
                      };
                      if (stockQty <= 0) {
                        toast.warning(`Aviso: El stock del producto "${variant.productName}" quedará en negativo (Stock disponible: ${stockQty} pzs.)`);
                      }
                      addVariantToCart(fakeProduct, fakeVariant, stockQty);
                      setShowSearchModal(false);
                      setSearchResults([]);
                      setSearchTerm('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-3 bg-bg-dark/50 border border-border-card/60 hover:border-primary/50 hover:bg-bg-dark rounded-xl cursor-pointer transition-all flex items-center justify-between gap-4 group"
                  >
                    {/* Thumbnail Image */}
                    <div
                      onClick={(e) => {
                        if (variant.imageUrl) {
                          e.stopPropagation();
                          setSelectedImageForZoom(variant.imageUrl);
                        }
                      }}
                      className={`w-10 h-10 rounded-lg border border-border-card bg-bg-dark shrink-0 overflow-hidden flex items-center justify-center relative group/thumb transition-all ${
                        variant.imageUrl ? 'cursor-pointer hover:border-primary/50' : ''
                      }`}
                    >
                      {variant.imageUrl ? (
                        <>
                          <img src={variant.imageUrl} className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200" alt={variant.productName} />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-all duration-200">
                            <Maximize2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        </>
                      ) : (
                        <Package className="w-5 h-5 text-neutral/40" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-extrabold text-xs text-secondary group-hover:text-primary transition-colors truncate">
                          {variant.productName}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-neutral font-mono">
                        <span>SKU: {variant.sku}</span>
                        {variant.barcode && (
                          <>
                            <span className="text-border-card">•</span>
                            <span>Código: {variant.barcode}</span>
                          </>
                        )}
                        {hasAttributes && (
                          <>
                            <span className="text-border-card">•</span>
                            <span className="text-neutral font-semibold">
                              {variant.attributeValues.map((av: any) => `${av.attribute.name}: ${av.value}`).join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-xs text-secondary block font-mono">
                        ${Number(variant.salePrice || 0).toFixed(2)}
                      </span>
                      <span className={`text-[9px] font-bold mt-0.5 block ${stockQty > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {stockQty > 0 ? `${stockQty} disponibles` : 'Sin stock'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default POSView;
