import { CloseCashSession } from '../application/close-cash-session';
import { cashSessionsService } from './cash-sessions.service';

/** Raíz de composición del módulo: enchufa el servicio HTTP al caso de uso. */
export const closeCashSession = new CloseCashSession({
  close: cashSessionsService.closeCashSession,
  getDetails: cashSessionsService.getCashSessionDetails,
});
