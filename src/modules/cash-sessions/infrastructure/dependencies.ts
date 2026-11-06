import { CloseCashSession } from '../application/close-cash-session';
import { CashSessionsHttpRepository } from './cash-sessions.http-repository';

/** Raíz de composición del módulo: enchufa la implementación HTTP a los casos de uso. */
export const cashSessionsRepository = new CashSessionsHttpRepository();
export const closeCashSession = new CloseCashSession(cashSessionsRepository);
