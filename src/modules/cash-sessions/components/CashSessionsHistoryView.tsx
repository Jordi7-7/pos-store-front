import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  ArrowRight, 
  Loader2,
  Lock,
  Unlock,
  RotateCcw,
  Printer,
} from 'lucide-react';
import { useCashSessionsList } from '../hooks/useCashSessions';
import type { CashSessionHeader } from '../types/cash-sessions.types';
import { useAuthStore } from '../../auth/hooks/useAuthStore';
import { useLayoutContext } from '@/providers/LayoutContext';
import { cashSessionsService } from '../services/cash-sessions.service';
import { ThermalClosingTicketModal } from '../../sales/components/pos/ThermalClosingTicketModal';
import { buildClosingTicketData } from '../utils/buildClosingTicketData';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CashSessionAuditModal } from './CashSessionAuditModal';

export const CashSessionsHistoryView: React.FC = () => {
  const timezone = useAuthStore((state) => state.timezone) || 'America/Guayaquil';
  const { selectedBranchId } = useLayoutContext();
  const publicTenant = useAuthStore((state) => state.publicTenant);

  const isAllBranches = !selectedBranchId;
  const { sessions, isLoading: listLoading, refetch } = useCashSessionsList(selectedBranchId || undefined);

  // Selected session for detail modal
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Direct print ticket state
  const [sessionClosingDataToPrint, setSessionClosingDataToPrint] = useState<any | null>(null);
  const [isClosingTicketModalOpen, setIsClosingTicketModalOpen] = useState(false);
  const [printingSessionId, setPrintingSessionId] = useState<string | null>(null);

  const handlePrintSessionById = async (sessionId: string) => {
    try {
      setPrintingSessionId(sessionId);
      const details = await cashSessionsService.getCashSessionDetails(sessionId);

      const sessionTicketData = buildClosingTicketData(details);

      setSessionClosingDataToPrint(sessionTicketData);
      setIsClosingTicketModalOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Error al obtener detalles para imprimir el ticket');
    } finally {
      setPrintingSessionId(null);
    }
  };

  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered sessions
  const filteredSessions = useMemo<CashSessionHeader[]>(() => {
    return sessions.filter((s: CashSessionHeader) => {
      const regName = s.cashRegister?.name || '';
      const regCode = String(s.cashRegister?.code || '');
      return (
        regName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        regCode.includes(searchTerm)
      );
    });
  }, [sessions, searchTerm]);

  // Formatter helpers
  const formatSessionTime = (openedStr: string, closedStr: string | null) => {
    const opened = new Date(openedStr);
    const dateFormatted = opened.toLocaleDateString('es-EC', {
      timeZone: timezone,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const openTime = opened.toLocaleTimeString('es-EC', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
    });

    if (!closedStr) {
      return (
        <div>
          <span className="font-semibold text-secondary block">{dateFormatted}</span>
          <span className="text-[11px] text-emerald-600 font-medium">Desde {openTime} (En curso)</span>
        </div>
      );
    }

    const closed = new Date(closedStr);
    const closeTime = closed.toLocaleTimeString('es-EC', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div>
        <span className="font-semibold text-secondary block">{dateFormatted}</span>
        <span className="text-[11px] text-neutral font-medium">{openTime} — {closeTime}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="border-b border-border/60 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Historial de Sesiones de Caja ({filteredSessions.length})
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Auditoría de aperturas, ventas facturadas y arqueos de cierre por caja.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Search input */}
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-neutral absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por caja..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-bg-dark border border-border-card rounded-xl text-xs text-secondary placeholder:text-neutral/60 focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Refresh Button */}
              <Button
                onClick={() => refetch()}
                variant="outline"
                size="sm"
                className="h-8 px-3 rounded-xl border-border bg-card hover:bg-muted text-xs font-medium text-foreground shadow-xs cursor-pointer flex items-center gap-1.5"
                title="Sincronizar sesiones"
              >
                <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Sincronizar</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
        {listLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Cargando historial de cajas...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <History className="w-10 h-10 text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">No se encontraron sesiones de caja en el historial.</p>
            {searchTerm && (
              <Button variant="link" size="sm" onClick={() => setSearchTerm('')} className="text-xs">
                Limpiar búsqueda
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-b-xl border-t border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="font-semibold text-xs">Caja Registradora</TableHead>
                  {isAllBranches && <TableHead className="font-semibold text-xs">Sucursal</TableHead>}
                  <TableHead className="font-semibold text-xs">Horario de Sesión</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Ventas Totales</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Diferencia / Arqueo</TableHead>
                  <TableHead className="font-semibold text-xs text-center">Estado</TableHead>
                  <TableHead className="w-[120px] text-right font-semibold text-xs pr-4">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.map((s: CashSessionHeader) => {
                  const hasDiff = s.difference !== null && s.difference !== undefined;
                  const diffVal = hasDiff ? Number(s.difference) : 0;
                  const isExact = hasDiff && Math.abs(diffVal) < 0.05;

                  return (
                    <TableRow key={s.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
                      {/* Avatar / Number badge */}
                      <TableCell className="py-2.5 pl-4 pr-1">
                        <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-primary font-mono font-bold text-xs shrink-0">
                          #{s.cashRegister?.code || '1'}
                        </div>
                      </TableCell>

                      {/* Caja Registradora */}
                      <TableCell className="py-2.5">
                        <div className="font-semibold text-xs text-foreground leading-tight">
                          {s.cashRegister?.name || 'Caja Registradora'}
                        </div>
                      </TableCell>

                      {/* Sucursal (Modo Consolidado) */}
                      {isAllBranches && (
                        <TableCell className="py-2.5">
                          <span className="text-[10px] font-semibold bg-muted text-foreground/80 px-2 py-0.5 rounded-md border border-border whitespace-nowrap">
                            {s.branch?.name || 'Sucursal'}
                          </span>
                        </TableCell>
                      )}

                      {/* Horario de Sesión */}
                      <TableCell className="py-2.5 text-xs whitespace-nowrap text-foreground/90">
                        {formatSessionTime(s.openedAt, s.closedAt)}
                      </TableCell>

                      {/* Ventas Totales */}
                      <TableCell className="py-2.5 text-right font-mono font-semibold text-xs text-foreground">
                        ${Number(s.totalSales || 0).toFixed(2)}
                      </TableCell>

                      {/* Diferencia / Arqueo */}
                      <TableCell className="py-2.5 text-center font-mono text-xs">
                        {s.status === 'OPEN' ? (
                          <span className="text-muted-foreground/60 text-xs italic">En turno</span>
                        ) : isExact ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                            Exacto ($0.00)
                          </span>
                        ) : diffVal > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-500 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                            +${diffVal.toFixed(2)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                            -${Math.abs(diffVal).toFixed(2)}
                          </span>
                        )}
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="py-2.5 text-center">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          s.status === 'CLOSED' 
                            ? 'bg-muted text-muted-foreground border border-border' 
                            : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {s.status === 'CLOSED' ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5 animate-pulse" />}
                          {s.status === 'CLOSED' ? 'Cerrada' : 'Abierta'}
                        </span>
                      </TableCell>

                      {/* Acción */}
                      <TableCell className="py-2.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePrintSessionById(s.id)}
                            disabled={printingSessionId === s.id}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Imprimir ticket de sesión / arqueo"
                          >
                            {printingSessionId === s.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Printer className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSessionId(s.id)}
                            className="h-7 px-2.5 rounded-lg border-border hover:bg-muted text-xs font-medium text-foreground cursor-pointer flex items-center gap-1"
                          >
                            <span>Auditar Caja</span>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Details Dialog Reusable Component */}
      <CashSessionAuditModal
        sessionId={selectedSessionId}
        isOpen={!!selectedSessionId}
        onClose={() => setSelectedSessionId(null)}
      />

      {/* Modal de Impresión Directa de Ticket de Arqueo y Cierre */}
      {isClosingTicketModalOpen && (
        <ThermalClosingTicketModal
          isOpen={isClosingTicketModalOpen}
          onClose={() => {
            setIsClosingTicketModalOpen(false);
            setSessionClosingDataToPrint(null);
          }}
          sessionData={sessionClosingDataToPrint}
          tenantRuc={publicTenant?.ruc || ''}
          tenantName={publicTenant?.name || ''}
        />
      )}
    </div>
  );
};
export default CashSessionsHistoryView;
