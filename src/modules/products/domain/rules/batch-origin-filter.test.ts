import { describe, expect, it } from 'vitest';
import { BatchOriginType } from '../enums';
import { toggleOriginType } from './batch-origin-filter';

describe('toggleOriginType', () => {
  it('marca un tipo y lo desmarca', () => {
    expect(toggleOriginType([], BatchOriginType.REFUND)).toEqual([BatchOriginType.REFUND]);
    expect(toggleOriginType([BatchOriginType.REFUND], BatchOriginType.REFUND)).toEqual([]);
  });

  it('mantiene el orden del filtro sin importar el orden de clic', () => {
    const selected = toggleOriginType([BatchOriginType.REFUND], BatchOriginType.PURCHASE);
    expect(selected).toEqual([BatchOriginType.PURCHASE, BatchOriginType.REFUND]);
  });

  it('con todos los tipos marcados vuelve a "Todos" (lista vacía)', () => {
    const three = [BatchOriginType.PURCHASE, BatchOriginType.INITIAL_STOCK, BatchOriginType.ADJUSTMENT];
    expect(toggleOriginType(three, BatchOriginType.REFUND)).toEqual([]);
  });
});
