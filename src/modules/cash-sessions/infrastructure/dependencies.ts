import { CloseCashSession } from '../application/use-cases/close-cash-session';
import { OpenCashSession } from '../application/use-cases/open-cash-session';
import { RegisterExpense } from '../application/use-cases/register-expense';
import { CashSessionsHttpRepository } from './repositories/cash-sessions.http-repository';

/** Raíz de composición del módulo: enchufa la implementación HTTP a los casos de uso. */
export const cashSessionsRepository = new CashSessionsHttpRepository();
export const openCashSession = new OpenCashSession(cashSessionsRepository);
export const closeCashSession = new CloseCashSession(cashSessionsRepository);
export const registerExpense = new RegisterExpense(cashSessionsRepository);
