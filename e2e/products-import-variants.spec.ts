import { test, expect } from '@playwright/test';
import * as XLSX from 'xlsx';
import { adminApi, creds, emptyStock, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

interface ProductsPage {
  data: Array<{ id: string; name: string; type: string; baseSku: string; variants: Array<{ id: string; sku: string; salePrice: number; stocks?: Array<{ branchId: string; quantity: number }> }> }>;
}

test.setTimeout(90_000);

const workbook = (rows: unknown[][]) => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Productos');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
};
const HEAD = ['Producto', 'SKU base', 'Categoría', 'Atributo 1', 'Valor 1', 'Atributo 2', 'Valor 2', 'SKU', 'Precio de compra', 'Precio de venta', 'Existencias'];

test('importar desde Excel: errores por fila sin guardar nada, y luego el archivo bueno se guarda entero', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const base = `E2EI${stamp}`;
  const name = `Producto e2e import ${stamp}`;
  const simpleSku = `E2EIS${stamp}`;
  const category = `E2E Categoría ${stamp}`;
  const attribute = `E2E Atributo imp ${stamp}`;
  const find = async (search: string) => (await admin.call<ProductsPage>('GET', `/products?search=${search}&limit=5`)).data.data;

  try {
    await login(page);
    await page.locator('header select').selectOption({ index: 1 });
    await page.goto('/inventario/crear-compuesto');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Importar desde Excel' }).click();
    const dialog = page.getByRole('dialog');

    // 1) Un archivo con un precio de venta vacío y un número ilegible: se señalan las filas y no se guarda nada
    await dialog.getByLabel('Archivo de Excel').setInputFiles({
      name: 'errores.xlsx',
      mimeType: 'application/octet-stream',
      buffer: workbook([HEAD, [name, base, category, attribute, 'M', '', '', `${base}-M`, 5, '', 2], [name, base, category, attribute, 'L', '', '', `${base}-L`, 5, 'doce', 2]]),
    });
    await expect(dialog.getByText(/problemas por corregir/)).toBeVisible();
    await expect(dialog.getByRole('cell', { name: 'Falta el precio de venta.' }).first()).toBeVisible();
    await expect(dialog.getByRole('cell', { name: '"doce" no es un número.' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /^Importar/ })).toBeDisabled();
    expect(await find(base)).toHaveLength(0);

    // 2) El archivo bueno: un producto con dos variantes (atributo y categoría nuevos) y uno simple
    await dialog.getByLabel('Archivo de Excel').setInputFiles({
      name: 'bien.xlsx',
      mimeType: 'application/octet-stream',
      buffer: workbook([
        HEAD,
        [name, base, category, attribute, 'M', '', '', `${base}-M`, 5, 12, 3],
        [name, base, category, attribute, 'L', '', '', `${base}-L`, 5, '12,5', 4],
        [`${name} simple`, '', '', '', '', '', '', simpleSku, 1, 3, 10],
      ]),
    });
    await expect(dialog.getByText(/El archivo está bien/)).toBeVisible();
    await expect(dialog.getByText(`Categorías nuevas: ${category}`)).toBeVisible();
    const imported = page.waitForResponse((r) => r.url().endsWith('/products/import-variants') && r.request().method() === 'POST' && r.request().postDataJSON().dryRun === false);
    await dialog.getByRole('button', { name: 'Importar 2 productos' }).click();
    expect((await imported).status()).toBe(201);

    const variable = (await find(base))[0];
    expect(variable).toMatchObject({ type: 'VARIABLE', baseSku: base });
    const bySku = new Map((variable?.variants ?? []).map((variant) => [variant.sku, variant]));
    expect([...bySku.keys()].sort()).toEqual([`${base}-L`, `${base}-M`]);
    expect(bySku.get(`${base}-L`)?.salePrice).toBe(12.5);
    expect(Number(bySku.get(`${base}-M`)?.stocks?.[0]?.quantity)).toBe(3);
    expect((await find(simpleSku))[0]).toMatchObject({ type: 'SIMPLE' });

    // 3) Volver a subir el mismo archivo ya no es válido: los SKU existen
    await page.getByRole('button', { name: 'Importar desde Excel' }).click();
    await page.getByRole('dialog').getByLabel('Archivo de Excel').setInputFiles({
      name: 'repetido.xlsx',
      mimeType: 'application/octet-stream',
      buffer: workbook([HEAD, [`${name} simple`, '', '', '', '', '', '', simpleSku, 1, 3, 10]]),
    });
    await expect(page.getByRole('dialog').getByRole('cell', { name: new RegExp(`El SKU ${simpleSku} ya existe`) })).toBeVisible();
  } finally {
    const products = [...(await find(base)), ...(await find(simpleSku))];
    for (const product of products) {
      for (const variant of product.variants) {
        for (const stock of variant.stocks ?? []) {
          if (Number(stock.quantity) > 0) await emptyStock(admin, stock.branchId, variant.id, Number(stock.quantity));
        }
      }
      await admin.call('DELETE', `/products/${product.id}`);
    }
    // El importador creó el atributo: se busca por su nombre y se borra
    const created = (await admin.call<Array<{ id: string; name: string }>>('GET', '/products/attributes')).data.find((item) => item.name === attribute);
    if (created) await admin.call('DELETE', `/products/attributes/${created.id}`);
  }
});
