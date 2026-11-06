import { parseCountedCash } from '../domain/cash-closing';
import type { CashSessionDetails } from '../types/cash-sessions.types';
import type { CashSessionsGateway } from './ports/cash-sessions-gateway';

export class CloseCashSessionError extends Error {
  readonly code = 'INVALID_COUNT';
  constructor() {
    super('Debes ingresar el monto de efectivo físico para cerrar la caja.');
    this.name = 'CloseCashSessionError';
  }
}

export interface CloseCashSessionResult {
  /**
   * Resumen real del turno ya cerrado (para el corte Z), o `null` si no se pudo leer. Nunca se
   * inventa: sin él no se imprime corte.
   */
  details: CashSessionDetails | null;
}

/**
 * Cerrar el turno con el efectivo contado. Valida el importe antes de llamar al servidor (que es
 * quien calcula el esperado y la diferencia) y después intenta leer el resumen para el corte.
 */
export class CloseCashSession {
  constructor(private readonly gateway: CashSessionsGateway) {}

  async execute(input: { sessionId: string; countedCash: string }): Promise<CloseCashSessionResult> {
    const counted = parseCountedCash(input.countedCash);
    if (counted === null) throw new CloseCashSessionError();

    await this.gateway.close(input.sessionId, counted);

    try {
      return { details: await this.gateway.getDetails(input.sessionId) };
    } catch {
      // El turno ya está cerrado: no falla el cierre porque no se pueda leer el resumen.
      return { details: null };
    }
  }
}
