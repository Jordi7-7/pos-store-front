export type CashSessionErrorCode =
  | 'BRANCH_REQUIRED'
  | 'REGISTER_REQUIRED'
  | 'INVALID_OPENING_BALANCE'
  | 'DESCRIPTION_REQUIRED'
  | 'INVALID_EXPENSE_AMOUNT'
  | 'INVALID_COUNT';

/** Una regla del turno de caja no se cumple. El `code` permite decidir el aviso sin parsear el texto. */
export class CashSessionError extends Error {
  constructor(
    readonly code: CashSessionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'CashSessionError';
  }
}
