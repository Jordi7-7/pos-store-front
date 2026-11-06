import { describe, expect, it } from 'vitest';
import type { ProductDTO } from '../dtos/product.dto';
import { toProductEntity } from './product.mapper';

const product = (variant: Record<string, unknown>): ProductDTO =>
  ({ id: 'p', name: 'Camisa', description: '', variants: [{ sku: 'A', barcode: '1', purchasePrice: 50, salePrice: 100, ...variant }] }) as unknown as ProductDTO;

describe('atributos de una variante (el backend los manda de dos formas)', () => {
  it('el listado manda `attributes` con nombre y valor', () => {
    const variant = toProductEntity(product({ attributes: [{ name: 'Talla', value: 'M' }] })).variants[0];
    expect(variant?.attributes).toEqual([{ name: 'Talla', value: 'M' }]);
  });

  it('el detalle manda `attributeValues` con el atributo anidado: se convierte y conserva los ids (defecto: antes salía vacío)', () => {
    const detail = { attributeValues: [{ id: 'v1', attributeId: 'a1', value: 'M', attribute: { id: 'a1', name: 'Talla' } }] };
    expect(toProductEntity(product(detail)).variants[0]?.attributes).toEqual([{ name: 'Talla', value: 'M', attributeId: 'a1', valueId: 'v1' }]);
  });

  it('si el valor trae el atributo solo anidado, toma su id de ahí', () => {
    const detail = { attributeValues: [{ id: 'v1', value: 'Rojo', attribute: { id: 'a2', name: 'Color' } }] };
    expect(toProductEntity(product(detail)).variants[0]?.attributes[0]).toMatchObject({ name: 'Color', attributeId: 'a2' });
  });

  it('un producto simple no tiene atributos', () => {
    expect(toProductEntity(product({})).variants[0]?.attributes).toEqual([]);
  });
});

describe('etiquetas de una variante', () => {
  it('se conservan (defecto: se descartaban y el editor guardaba la variante sin ninguna etiqueta)', () => {
    const variant = toProductEntity(product({ tags: [{ id: 't1', name: 'Oferta', extra: 'x' }] })).variants[0];
    expect(variant?.tags).toEqual([{ id: 't1', name: 'Oferta' }]);
  });

  it('sin etiquetas queda una lista vacía', () => {
    expect(toProductEntity(product({})).variants[0]?.tags).toEqual([]);
  });
});
