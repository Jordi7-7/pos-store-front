import { test, expect } from '@playwright/test';
import { adminApi, creds, deleteProductsMatching, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

interface Attribute {
  id: string;
  name: string;
  values?: Array<{ id: string; value: string }>;
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
    await deleteProductsMatching(admin, sku);
    for (const id of createdIds) await admin.call('DELETE', `/products/attributes/${id}`);
  }
});

test('catálogo de atributos: las opciones se ordenan como tallas, se ajustan con las flechas y el orden queda guardado', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const name = `E2E Talla ${stamp}`;
  const attribute = (await admin.call<Attribute>('POST', '/products/attributes', { name })).data;
  const valuesOf = async () => ((await admin.call<Attribute[]>('GET', '/products/attributes')).data.find((item) => item.id === attribute.id)?.values ?? []).map((value) => value.value);

  try {
    for (const value of ['L', 'S', 'XL', 'M']) await admin.call('POST', '/products/attributes/values', { attributeId: attribute.id, value });
    expect(await valuesOf()).toEqual(['L', 'S', 'XL', 'M']); // el orden en que se crearon

    await login(page);
    await page.goto('/inventario/crear-compuesto');
    await page.waitForLoadState('networkidle');
    await page.getByRole('tab', { name: /Catálogo de atributos/ }).click();
    await page.getByPlaceholder('Buscar atributo o valor...').fill(stamp);
    await page.getByRole('button', { name: `Ordenar las opciones de ${name}` }).click();

    const dialog = page.getByRole('dialog').filter({ hasText: `Ordenar ${name}` });
    await expect(dialog.getByRole('button', { name: 'Guardar orden' })).toBeDisabled(); // sin cambios no hay nada que guardar
    await dialog.getByRole('button', { name: 'Ordenar como tallas' }).click();
    await expect(dialog.getByRole('listitem').locator('span.truncate')).toHaveText(['S', 'M', 'L', 'XL']);
    await dialog.getByRole('button', { name: 'Subir XL' }).click();
    await expect(dialog.getByRole('listitem').locator('span.truncate')).toHaveText(['S', 'M', 'XL', 'L']);

    const saved = page.waitForResponse((r) => /\/products\/attributes\/[^/]+\/values\/order$/.test(r.url()) && r.request().method() === 'PUT');
    await dialog.getByRole('button', { name: 'Guardar orden' }).click();
    expect((await saved).status()).toBe(200);
    expect(await valuesOf()).toEqual(['S', 'M', 'XL', 'L']);
  } finally {
    await admin.call('DELETE', `/products/attributes/${attribute.id}`);
  }
});
