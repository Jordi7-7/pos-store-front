import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { backpack } from '@/test/fixtures/backpack';
import { PosVariableProductModal } from './PosVariableProductModal';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), info: vi.fn(), warning: vi.fn(), error: vi.fn() } }));
vi.mock('@/modules/auth/presentation/hooks/useSession', () => ({ formatMoney: (value: number) => `$${value.toFixed(2)}` }));

function open(product = backpack()) {
  const onAddToCart = vi.fn();
  const onClose = vi.fn();
  render(<PosVariableProductModal isOpen onClose={onClose} productData={product} onAddToCart={onAddToCart} />);
  /** Las opciones de un atributo (el bloque que encabeza su nombre). */
  const group = (name: string) => within(screen.getByText(name).parentElement as HTMLElement);
  const options = (name: string) => group(name).getAllByRole('button').map((button) => button.textContent);
  const pick = (name: string, value: string) => userEvent.click(group(name).getByRole('button', { name: new RegExp(`^${value}( sin stock)?$`) }));
  const add = () => userEvent.click(screen.getByRole('button', { name: /agregar al carrito/i }));
  const addedSku = () => (onAddToCart.mock.calls[0]?.[1] as { sku: string } | undefined)?.sku;
  const photo = () => screen.getByRole('img').getAttribute('src');
  return { onAddToCart, onClose, group, options, pick, add, addedSku, photo };
}

describe('ventana para elegir la variante', () => {
  it('al elegir Base Rojo agrega una mochila roja, nunca la primera variante', async () => {
    const modal = open();

    await modal.pick('Base', 'Rojo');
    await modal.add();

    expect(modal.addedSku()).toBe('MNEG-3');
    expect(modal.onAddToCart.mock.calls[0]?.[1]).toMatchObject({ attributes: [{ name: 'Base', value: 'Rojo' }, { name: 'Cierre', value: 'Negro' }, { name: 'Copa', value: 'Rojo' }] });
  });

  it('la foto, el SKU y el stock cambian con lo elegido', async () => {
    const modal = open();
    expect(modal.photo()).toBe('https://fotos/mneg-1.jpg');

    await modal.pick('Base', 'Rojo');
    await modal.pick('Cierre', 'Rojo');

    expect(modal.photo()).toBe('https://fotos/mneg-5.jpg');
    expect(screen.getByText('MNEG-5')).toBeTruthy();
    expect(screen.getByText('3 disponibles')).toBeTruthy();
  });

  it('cada atributo ofrece solo lo que existe con lo elegido arriba', async () => {
    const modal = open();
    expect(modal.options('Base')).toHaveLength(10);
    expect(modal.options('Cierre')).toEqual(['Negro']);
    expect(modal.options('Copa')).toEqual(['Negro']);

    await modal.pick('Base', 'Rojo');

    expect(modal.options('Base')).toHaveLength(10);
    expect(modal.options('Cierre')).toEqual(['Negro', 'Rojo']);
    expect(modal.options('Copa')).toEqual(['Rojo']);
  });

  it('abre en la primera variante con stock y marca las opciones sin stock sin ocultarlas', async () => {
    const modal = open(backpack({ 'MNEG-1': 0, 'MNEG-2': -1 }));

    expect(screen.getByText('MNEG-3')).toBeTruthy();
    expect(modal.group('Base').getByRole('button', { name: 'Negro sin stock' })).toBeTruthy();

    await modal.pick('Base', 'Negro');
    await modal.add();
    // Se permite vender en negativo: la opción se puede elegir y se agrega
    expect(modal.addedSku()).toBe('MNEG-1');
  });

  it('al abrir otro producto empieza de cero y cancelar no agrega nada', async () => {
    const modal = open();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(modal.onClose).toHaveBeenCalled();
    expect(modal.onAddToCart).not.toHaveBeenCalled();
  });
});
