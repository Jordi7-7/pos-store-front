import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useMyCashRegisters } from '@/modules/cash-registers/presentation/hooks/useCashRegisters';
import { useCashSessionDetailsQuery } from '@/modules/cash-sessions/presentation/hooks/useCashSessions';
import { CloseCashSessionError } from '@/modules/cash-sessions/application/close-cash-session';
import { buildClosingTicketData } from '@/modules/cash-sessions/presentation/utils/buildClosingTicketData';
import { useLayoutContext } from '@/providers/LayoutContext';
import { useWorkspaceStore } from '@/shared/presentation/stores/workspace.store';
import { getErrorMessage } from '@/shared/presentation/error-messages';
import { thermalPrinterService } from '../../../infrastructure/printing/thermal-printer.service';
import { useActiveCashSession, useCloseCashSession, useOpenCashSession } from '../useCashSession';
import { useRegisterExpense } from '../useSalesMutations';
import type { ActiveCashSession, ClosingDetailsStatus } from '@/modules/cash-sessions/domain/session-types';

const EXPENSE_CATEGORY = 'Servicios';

interface Options {
  externalActiveSession?: ActiveCashSession | null;
  setExternalActiveSession?: (session: ActiveCashSession | null) => void;
}

/**
 * Turno de caja en el POS: sesión activa, caja elegida, apertura, gastos y cierre con su corte,
 * más el estado de los modales que lo gestionan. La lógica de dinero está en los casos de uso.
 */
export function usePOSShift({ externalActiveSession, setExternalActiveSession }: Options) {
  const { selectedBranchId } = useLayoutContext();
  const { selectedCashRegisterId, setSelectedCashRegisterId } = useWorkspaceStore();
  const { myCashRegisters: availableRegistersForUser } = useMyCashRegisters(selectedBranchId || undefined);
  const [selectedRegisterId, setSelectedRegisterId] = useState<string>(selectedCashRegisterId || '');

  // Sesión activa: la que llega por props o, si no, la que consulta el servidor
  const { activeSession: queryActiveCashSession } = useActiveCashSession(selectedBranchId || undefined);
  const [internalSession, setInternalSession] = useState<ActiveCashSession | null>(null);
  useEffect(() => {
    if (queryActiveCashSession !== undefined) setInternalSession(queryActiveCashSession && queryActiveCashSession.id ? queryActiveCashSession : null);
  }, [queryActiveCashSession]);

  const rawSession = externalActiveSession !== undefined ? externalActiveSession : internalSession;
  const activeSession = rawSession && rawSession.id ? rawSession : null;
  const setActiveCashSession = (session: ActiveCashSession | null) => {
    const valid = session && session.id ? session : null;
    setInternalSession(valid);
    setExternalActiveSession?.(valid);
  };

  // Mantener la caja elegida en sincronía con la sesión activa o con el estado de trabajo
  useEffect(() => {
    if (activeSession?.cashRegisterId) {
      setSelectedRegisterId(activeSession.cashRegisterId);
      setSelectedCashRegisterId(activeSession.cashRegisterId);
    } else if (selectedCashRegisterId) {
      setSelectedRegisterId(selectedCashRegisterId);
    }
  }, [activeSession?.cashRegisterId, selectedCashRegisterId, setSelectedCashRegisterId]);

  // Modales
  const [isAperturaModalOpen, setIsAperturaModalOpen] = useState(false);
  const [isEgresoModalOpen, setIsEgresoModalOpen] = useState(false);
  const [isCierreModalOpen, setIsCierreModalOpen] = useState(false);
  const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
  const [isExchangeReturnModalOpen, setIsExchangeReturnModalOpen] = useState(false);
  const [isPrinterConfigOpen, setIsPrinterConfigOpen] = useState(false);

  // El resumen del turno solo se pide cuando se abre el cierre o el historial
  const { rawDetails: sessionDetails, isError: isSessionDetailsError } = useCashSessionDetailsQuery(activeSession?.id || null, {
    enabled: isCierreModalOpen || isHistorialModalOpen,
  });
  const detailsStatus: ClosingDetailsStatus = sessionDetails ? 'ready' : isSessionDetailsError ? 'unavailable' : 'loading';

  // Formularios
  const [openingBalance, setOpeningBalance] = useState('1000.00');
  const [closingBalance, setClosingBalance] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // Corte Z para imprimir / previsualizar
  const [closingSessionToPrint, setClosingSessionToPrint] = useState<ReturnType<typeof buildClosingTicketData> | null>(null);
  const [isClosingTicketOpen, setIsClosingTicketOpen] = useState(false);

  const { openSession, isOpening } = useOpenCashSession();
  const { closeSession, isClosing } = useCloseCashSession();
  const { registerExpense, isRegistering } = useRegisterExpense();

  const handleOpenSession = async () => {
    if (!selectedBranchId) {
      toast.warning('Por favor selecciona una sucursal activa.');
      return;
    }
    if (!selectedRegisterId) {
      toast.warning('Por favor selecciona una caja registradora.');
      return;
    }
    try {
      const session = await openSession({
        branchId: selectedBranchId,
        cashRegisterId: selectedRegisterId,
        openingBalance: parseFloat(openingBalance || '0'),
      });
      setActiveCashSession(session);
      setIsAperturaModalOpen(false);
      toast.success('¡Caja registradora abierta con éxito!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al abrir la caja.'));
    }
  };

  const handleCloseSession = async () => {
    if (!activeSession) return;
    try {
      // El corte Z solo se imprime con datos reales del servidor: si no se pudieron leer, no se inventan.
      const { details } = await closeSession({ id: activeSession.id, countedCash: closingBalance });
      const closingData = details ? buildClosingTicketData(details) : null;

      setActiveCashSession(null);
      setIsCierreModalOpen(false);

      if (!closingData) {
        toast.warning('Caja cerrada. No se pudo cargar el resumen para imprimir el corte; un administrador puede reimprimirlo desde el historial de cajas.');
        return;
      }
      setClosingSessionToPrint(closingData);

      if (await thermalPrinterService.isConfigured()) {
        try {
          await thermalPrinterService.printClosingTicket(closingData);
          toast.success('¡Sesión de caja cerrada y corte impreso en ticket!');
        } catch (printErr) {
          console.error('Error al imprimir corte directo:', printErr);
          setIsClosingTicketOpen(true);
        }
      } else {
        setIsClosingTicketOpen(true);
      }
    } catch (err) {
      toast.error(err instanceof CloseCashSessionError ? err.message : getErrorMessage(err, 'Error al cerrar la caja.'));
    }
  };

  const handleAddExpense = async () => {
    if (!selectedBranchId) return;
    if (!expenseDesc.trim()) {
      toast.warning('Por favor ingresa una descripción para el gasto.');
      return;
    }
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      toast.warning('Por favor ingresa un monto válido.');
      return;
    }
    try {
      await registerExpense({
        branchId: selectedBranchId,
        cashSessionId: activeSession?.id,
        description: expenseDesc.trim(),
        amount: parseFloat(expenseAmount),
        category: EXPENSE_CATEGORY,
      });
      setExpenseDesc('');
      setExpenseAmount('');
      setIsEgresoModalOpen(false);
      toast.success('¡Gasto registrado con éxito!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Error al registrar el gasto.'));
    }
  };

  return {
    activeSession,
    availableRegistersForUser,
    selectedRegisterId,
    setSelectedRegisterId,
    // modales
    isAperturaModalOpen, setIsAperturaModalOpen,
    isEgresoModalOpen, setIsEgresoModalOpen,
    isCierreModalOpen, setIsCierreModalOpen,
    isHistorialModalOpen, setIsHistorialModalOpen,
    isExchangeReturnModalOpen, setIsExchangeReturnModalOpen,
    isPrinterConfigOpen, setIsPrinterConfigOpen,
    isClosingTicketOpen,
    closeClosingTicket: () => {
      setIsClosingTicketOpen(false);
      setClosingSessionToPrint(null);
    },
    closingSessionToPrint,
    // resumen del turno
    sessionDetails,
    detailsStatus,
    // formularios
    openingBalance, setOpeningBalance,
    closingBalance, setClosingBalance,
    expenseDesc, setExpenseDesc,
    expenseAmount, setExpenseAmount,
    // acciones
    handleOpenSession, isOpening,
    handleCloseSession, isClosing,
    handleAddExpense, isRegistering,
  };
}
