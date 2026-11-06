import { PurchasesHttpRepository } from './repositories/purchases.http-repository';
import { SuppliersHttpRepository } from './repositories/suppliers.http-repository';

/** Raíz de composición del módulo. */
export const purchasesRepository = new PurchasesHttpRepository();
export const suppliersRepository = new SuppliersHttpRepository();
