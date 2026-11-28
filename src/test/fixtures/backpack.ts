import type { PosVariableProductEntity } from '@/modules/products/domain/entities/catalog.entity';

/** Una mochila real con 11 variantes (Base × Cierre × Copa, sin todas las combinaciones), como responde el escaneo. */
const ROWS: ReadonlyArray<[base: string, cierre: string, copa: string, stock: number]> = [
  ['Negro', 'Negro', 'Negro', 68],
  ['Azul Electrico', 'Azul Electrico', 'Negro', 4],
  ['Rojo', 'Negro', 'Rojo', 3],
  ['Verde Jade', 'Verde Jade', 'Negro', 8],
  ['Rojo', 'Rojo', 'Negro', 3],
  ['Celeste', 'Celeste', 'Negro', 6],
  ['Verde', 'Verde', 'Negro', 4],
  ['Naranja', 'Naranja', 'Negro', 6],
  ['Verde Fluorescente', 'Verde Fluorescente', 'Negro', 8],
  ['Plomo', 'Plomo', 'Negro', 4],
  ['Azul Marino', 'Azul Marino', 'Azul Marino', 9],
];

const NAMES = ['Base', 'Cierre', 'Copa'] as const;

/** `stocks` cambia la existencia de algunas variantes (por SKU). */
export function backpack(stocks: Record<string, number> = {}): PosVariableProductEntity {
  return {
    productId: 'p-mochila',
    productName: 'Mochila Negra',
    productType: 'VARIABLE',
    baseSku: 'MNEG',
    imageUrl: 'https://fotos/mneg-1.jpg',
    attributes: NAMES.map((name, index) => ({
      id: name,
      name,
      values: [...new Set(ROWS.map((row) => row[index] as string))].map((value) => ({ id: `${name}:${value}`, value })),
    })),
    variants: ROWS.map(([base, cierre, copa, stock], index) => {
      const sku = `MNEG-${index + 1}`;
      const combination = [base, cierre, copa];
      return {
        id: `v${index + 1}`,
        sku,
        barcode: '',
        salePrice: 10,
        wholesalePrice: 6.5,
        stock: stocks[sku] ?? stock,
        imageUrl: `https://fotos/mneg-${index + 1}.jpg`,
        attributes: NAMES.map((name, i) => ({ name, value: combination[i] as string })),
        attributeValues: NAMES.map((name, i) => ({ attributeId: name, valueId: `${name}:${combination[i]}` })),
      };
    }),
  };
}
