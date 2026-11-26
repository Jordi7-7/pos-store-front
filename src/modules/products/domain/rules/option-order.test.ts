import { describe, expect, it } from 'vitest';
import type { AttributeEntity } from '../entities/catalog.entity';
import type { ProductVariantEntity } from '../entities/product.entity';
import { moveItem, sortAlphabetically, sortVariantsByOptions, suggestSizeOrder } from './option-order';

const opts = (...values: string[]) => values.map((value) => ({ id: value, value }));
const names = (list: ReadonlyArray<{ value: string }> | null) => list?.map((item) => item.value);

describe('orden de las opciones', () => {
  it('mover sube o baja una posición y en el borde no hace nada', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
    expect(moveItem(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'b', 'c']);
  });

  it('las tallas de letras se ordenan de menor a mayor, con XS, 2XL y 3XL en su lugar', () => {
    expect(names(suggestSizeOrder(opts('L', 'XL', 'S', 'M', '2XL', 'XS', 'XXS', '3XL')))).toEqual(['XXS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']);
    expect(names(suggestSizeOrder(opts('xl', 'm', 'XXL')))).toEqual(['m', 'xl', 'XXL']);
  });

  it('las tallas numéricas se ordenan por su valor, con decimales y coma', () => {
    expect(names(suggestSizeOrder(opts('40', '38.5', '10', '38,0')))).toEqual(['10', '38,0', '38.5', '40']);
  });

  it('si no son tallas (colores) o hay mezcla, no propone nada', () => {
    expect(suggestSizeOrder(opts('Rojo', 'Azul'))).toBeNull();
    expect(suggestSizeOrder(opts('M', '40'))).toBeNull();
    expect(suggestSizeOrder(opts('M'))).toBeNull();
  });

  it('el orden alfabético ignora mayúsculas y acentos y lee los números por su valor', () => {
    expect(names(sortAlphabetically(opts('Verde', 'azul', 'Ámbar', 'Rojo')))).toEqual(['Ámbar', 'azul', 'Rojo', 'Verde']);
    expect(names(sortAlphabetically(opts('Talla 10', 'Talla 2')))).toEqual(['Talla 2', 'Talla 10']);
  });
});

describe('variantes en el orden de las opciones', () => {
  const catalog: AttributeEntity[] = [
    { id: 'size', name: 'Talla', values: [{ id: 's', attributeId: 'size', value: 'S' }, { id: 'm', attributeId: 'size', value: 'M' }, { id: 'l', attributeId: 'size', value: 'L' }] },
    { id: 'color', name: 'Color', values: [{ id: 'r', attributeId: 'color', value: 'Rojo' }, { id: 'a', attributeId: 'color', value: 'Azul' }] },
  ];
  const variant = (sku: string, ...valueIds: string[]) => ({ sku, attributes: valueIds.map((valueId) => ({ name: '', value: '', valueId })) }) as unknown as ProductVariantEntity;

  it('ordena por el primer atributo y desempata por el segundo', () => {
    const sorted = sortVariantsByOptions([variant('L-A', 'l', 'a'), variant('S-A', 's', 'a'), variant('L-R', 'l', 'r'), variant('S-R', 's', 'r'), variant('M-R', 'm', 'r')], catalog);
    expect(sorted.map((v) => v.sku)).toEqual(['S-R', 'S-A', 'M-R', 'L-R', 'L-A']);
  });

  it('las variantes sin ids de valor conservan su orden y van al final', () => {
    const sorted = sortVariantsByOptions([variant('X1'), variant('M', 'm'), variant('X2')], catalog);
    expect(sorted.map((v) => v.sku)).toEqual(['M', 'X1', 'X2']);
  });
});
