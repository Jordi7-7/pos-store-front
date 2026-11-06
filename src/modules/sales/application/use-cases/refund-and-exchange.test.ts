import { describe, expect, it, vi } from 'vitest';
import { ExchangeError, ExchangeProducts, type ExchangeCommand } from './exchange-products';
import type { SalesRepository } from '../ports/sales.repository';
import { RefundSale, RefundSaleError } from './refund-sale';

describe('RefundSale', () => {
  const setup = () => {
    const processRefund = vi.fn<SalesRepository['processRefund']>(async () => undefined);
    return { processRefund, useCase: new RefundSale({ processRefund }) };
  };
  const base = { branchId: 'b', saleId: 's', cashSessionId: 'c', reason: '  ', defaultReason: 'Devolución desde POS', items: [{ variantId: 'v1', quantity: 2 }, { variantId: 'v2', quantity: 0 }] };

  it('envía solo las líneas con cantidad y usa el motivo por defecto si está vacío', async () => {
    const { processRefund, useCase } = setup();
    await useCase.execute(base);
    expect(processRefund).toHaveBeenCalledWith({ branchId: 'b', saleId: 's', cashSessionId: 'c', reason: 'Devolución desde POS', items: [{ variantId: 'v1', quantity: 2 }] });
  });

  it('conserva el motivo escrito (recortado)', async () => {
    const { processRefund, useCase } = setup();
    await useCase.execute({ ...base, reason: ' Talla ' });
    expect(processRefund.mock.calls[0]?.[0].reason).toBe('Talla');
  });

  it('sin cantidades no llama al servidor', async () => {
    const { processRefund, useCase } = setup();
    await expect(useCase.execute({ ...base, items: [{ variantId: 'v', quantity: 0 }] })).rejects.toBeInstanceOf(RefundSaleError);
    expect(processRefund).not.toHaveBeenCalled();
  });
});

describe('ExchangeProducts', () => {
  const command: ExchangeCommand = {
    branchId: 'b', cashSessionId: 'c', saleId: 's', customerId: 'cust', reason: '',
    returned: [{ variantId: 'v1', quantity: 1 }],
    newLines: [{ variantId: 'n1', quantity: 2, price: 20, discountAmount: 5 }],
  };
  const setup = () => {
    const refund = { execute: vi.fn(async () => undefined) };
    const checkout = { execute: vi.fn(async () => ({ receipt: { id: 'x', invoiceNumber: '1' }, total: 30, change: 0 })) };
    return { refund, checkout, useCase: new ExchangeProducts(refund, checkout) };
  };

  it('devuelve lo anterior y cobra lo nuevo en efectivo por su total (con descuentos), al mismo cliente', async () => {
    const { refund, checkout, useCase } = setup();
    expect(await useCase.execute(command)).toEqual({ newItemsTotal: 30 });
    expect(refund.execute).toHaveBeenCalledWith(expect.objectContaining({ saleId: 's', defaultReason: 'Cambio de prenda', items: command.returned }));
    expect(checkout.execute).toHaveBeenCalledWith(expect.objectContaining({ customerId: 'cust', payments: [{ paymentMethod: 'EFECTIVO', amount: 30 }] }));
  });

  it('sin productos nuevos no devuelve nada', async () => {
    const { refund, useCase } = setup();
    await expect(useCase.execute({ ...command, newLines: [] })).rejects.toMatchObject({ code: 'EMPTY_EXCHANGE' });
    expect(refund.execute).not.toHaveBeenCalled();
  });

  it('si la devolución falla, no se cobra lo nuevo', async () => {
    const { refund, checkout, useCase } = setup();
    refund.execute.mockRejectedValueOnce(new Error('409'));
    await expect(useCase.execute(command)).rejects.toThrow('409');
    expect(checkout.execute).not.toHaveBeenCalled();
  });

  it('si el cobro falla tras devolver, lo dice con un error propio y conserva la causa', async () => {
    const { checkout, useCase } = setup();
    const cause = new Error('sin red');
    checkout.execute.mockRejectedValueOnce(cause);
    const error = await useCase.execute(command).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ExchangeError);
    expect(error).toMatchObject({ code: 'REFUND_DONE_SALE_FAILED', cause });
    expect((error as Error).message).toMatch(/devolución ya quedó registrada/);
  });
});
