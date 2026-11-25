import { test, expect } from '@playwright/test';
import { adminApi, creds, emptyStock, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

interface Attribute {
  id: string;
  name: string;
  values?: Array<{ id: string; value: string }>;
}
interface ProductsPage {
  data: Array<{ id: string; variants: Array<{ id: string; stocks?: Array<{ branchId: string; quantity: number }> }> }>;
}

test.setTimeout(90_000);

test('catálogo de atributos: se elimina una opción y un atributo sin usar, y uno en uso se rechaza diciendo cuántas variantes lo usan', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const freeName = `E2E Libre ${stamp}`;
  const usedName = `E2E Usado ${stamp}`;
  const sku = `E2EA${stamp}`;
  const attributes = async () => (await admin.call<Attribute[]>('GET', '/products/attributes')).data;
  const byName = async (name: string) => (await attributes()).find((attribute) => attribute.name === name);
  const createdIds: string[] = [];

  try {
    const free = (await admin.call<Attribute>('POST', '/products/attributes', { name: freeName })).data;
    const used = (await admin.call<Attribute>('POST', '/products/attributes', { name: usedName })).data;
    createdIds.push(free.id, used.id);
    const freeValues = [];
    for (const value of ['Uno', 'Dos']) freeValues.push((await admin.call<{ id: string }>('POST', '/products/attributes/values', { attributeId: free.id, value })).data);
    const usedValue = (await admin.call<{ id: string }>('POST', '/products/attributes/values', { attributeId: used.id, value: 'Único' })).data;
    expect(freeValues).toHaveLength(2);
    const branchId = (await admin.call<Array<{ id: string }>>('GET', '/branches')).data[0]?.id ?? '';
    expect(
      (await admin.call('POST', '/products/variable', { name: `Producto e2e attr ${stamp}`, description: '', baseSku: sku, variants: [{ sku: `${sku}-1`, purchasePrice: 1, salePrice: 2, attributeValues: [{ attributeValueId: usedValue.id }], stocks: [{ branchId, quantity: 0 }] }] })).status,
    ).toBe(201);

    await login(page);
    await page.goto('/inventario/crear-compuesto');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /Catálogo de atributos/ }).click();
    await page.getByPlaceholder('Buscar atributo o valor...').fill(stamp);

    // Una opción sin usar se elimina; las demás quedan
    await page.getByRole('button', { name: `Eliminar la opción Uno de ${freeName}` }).click();
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(page.getByRole('button', { name: `Eliminar la opción Uno de ${freeName}` })).toHaveCount(0);
    expect((await byName(freeName))?.values?.map((value) => value.value)).toEqual(['Dos']);

    // Un atributo en uso no se elimina: el aviso dice cuántas variantes lo usan y el atributo sigue
    await page.getByRole('button', { name: `Eliminar el atributo ${usedName}` }).click();
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(page.getByText(/Lo usan 1 variante de productos/)).toBeVisible();
    expect(await byName(usedName)).toBeDefined();

    // Un atributo sin usar se elimina con sus opciones
    await page.getByRole('button', { name: `Eliminar el atributo ${freeName}` }).click();
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(page.getByRole('button', { name: `Eliminar el atributo ${freeName}` })).toHaveCount(0);
    expect(await byName(freeName)).toBeUndefined();
  } finally {
    const products = (await admin.call<ProductsPage>('GET', `/products?search=${sku}&limit=5`)).data.data;
    for (const product of products) {
      for (const variant of product.variants) {
        for (const stock of variant.stocks ?? []) if (Number(stock.quantity) > 0) await emptyStock(admin, stock.branchId, variant.id, Number(stock.quantity));
      }
      await admin.call('DELETE', `/products/${product.id}`);
    }
    for (const id of createdIds) await admin.call('DELETE', `/products/attributes/${id}`);
  }
});
