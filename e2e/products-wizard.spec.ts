import { test, expect } from '@playwright/test';
import { adminApi, creds, emptyStock, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

interface Attribute {
  id: string;
  name: string;
}
interface ProductsPage {
  data: Array<{ id: string; name: string; baseSku: string; variants: Array<{ id: string; sku: string; purchasePrice: number; salePrice: number; stocks?: Array<{ branchId: string; quantity: number }> }> }>;
}

test.setTimeout(90_000);

test('crear con variantes: la tabla se arma sola al marcar opciones y conserva lo escrito', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const baseSku = `E2EW${stamp}`;
  const name = `Producto e2e asistente ${stamp}`;
  const valueA = `A${stamp}`;
  const valueB = `B${stamp}`;
  const valueC = `C${stamp}`;
  let attributeId = '';

  try {
    // Preparación por API: un atributo propio con tres valores (se eligen dos y luego un tercero)
    const attribute = (await admin.call<Attribute>('POST', '/products/attributes', { name: `E2E Atributo ${stamp}` })).data;
    attributeId = attribute.id;
    for (const value of [valueA, valueB, valueC]) {
      await admin.call('POST', '/products/attributes/values', { attributeId, value });
    }

    await login(page);
    await page.locator('header select').selectOption({ index: 1 });
    await page.goto('/inventario/crear-compuesto');
    await page.waitForLoadState('networkidle');

    // Sin nombre no deja guardar
    await page.getByRole('button', { name: /Guardar producto/ }).click();
    await expect(page.getByText('El nombre del producto es obligatorio')).toBeVisible();
    await page.getByLabel(/SKU base/).fill(baseSku.toLowerCase()); // el campo lo pasa a mayúsculas
    await page.getByLabel(/Nombre del producto/).fill(name);

    // Los atributos se agregan a demanda (el catálogo puede tener decenas); el nuevo aparece entre los disponibles
    // (el buscador solo aparece cuando el catálogo tiene más de 12 atributos)
    const search = page.getByLabel('Buscar atributo');
    if ((await search.count()) > 0) await search.fill(`E2E Atributo ${stamp}`);
    await page.getByRole('button', { name: `E2E Atributo ${stamp}` }).click();

    // Dos opciones dan dos variantes, con SKU a partir de sus valores
    await page.getByRole('button', { name: valueA, exact: true }).click();
    await page.getByRole('button', { name: valueB, exact: true }).click();
    await expect(page.getByLabel(`SKU de ${valueA}`)).toHaveValue(`${baseSku}-${valueA}`);
    await expect(page.getByLabel(`SKU de ${valueB}`)).toHaveValue(`${baseSku}-${valueB}`);

    // Valores en bloque para todas, y un precio propio en la primera
    await page.getByLabel('Precio de compra', { exact: true }).fill('40');
    await page.getByLabel('Precio de venta', { exact: true }).fill('90');
    await page.getByLabel('Stock inicial', { exact: true }).fill('3');
    await page.getByRole('button', { name: /Aplicar a las 2/ }).click();
    await page.getByLabel(`Precio de venta de ${valueA}`).fill('95');

    // Añadir una opción NO borra lo ya escrito: la primera sigue en 95 y la nueva hereda los precios de la primera
    await page.getByRole('button', { name: valueC, exact: true }).click();
    await expect(page.getByLabel(`Precio de venta de ${valueA}`)).toHaveValue('95');
    await expect(page.getByLabel(`Precio de venta de ${valueC}`)).toHaveValue('95');
    await expect(page.getByLabel(`Stock inicial de ${valueB}`)).toHaveValue('3');
    await page.getByLabel(`Stock inicial de ${valueC}`).fill('3');

    // Una combinación que no vendes se quita; la fila que sigue se conserva
    await page.getByRole('button', { name: `Quitar la variante ${valueC}` }).click();
    await expect(page.getByLabel(`SKU de ${valueC}`)).toHaveCount(0);

    const created = page.waitForResponse((r) => r.url().endsWith('/products/variable') && r.request().method() === 'POST');
    await page.getByRole('button', { name: /Guardar producto con 2 variantes/ }).click();
    expect((await created).status()).toBe(201);

    const product = (await admin.call<ProductsPage>('GET', `/products?search=${baseSku}&limit=5`)).data.data[0];
    expect(product?.name).toBe(name);
    expect(product?.baseSku).toBe(baseSku);
    expect(product?.variants.map((v) => v.sku).sort()).toEqual([`${baseSku}-${valueA}`, `${baseSku}-${valueB}`]);
    const bySku = new Map((product?.variants ?? []).map((variant) => [variant.sku, variant]));
    expect(bySku.get(`${baseSku}-${valueA}`)).toMatchObject({ purchasePrice: 40, salePrice: 95 });
    expect(bySku.get(`${baseSku}-${valueB}`)).toMatchObject({ purchasePrice: 40, salePrice: 90 });
    for (const variant of product?.variants ?? []) expect(Number(variant.stocks?.[0]?.quantity)).toBe(3);
  } finally {
    const list = (await admin.call<ProductsPage>('GET', '/products?search=E2EW&limit=50')).data.data.filter((p) => p.name.startsWith('Producto e2e asistente '));
    for (const product of list) {
      for (const variant of product.variants) {
        for (const stock of variant.stocks ?? []) {
          if (Number(stock.quantity) > 0) await emptyStock(admin, stock.branchId, variant.id, Number(stock.quantity));
        }
      }
      await admin.call('DELETE', `/products/${product.id}`);
    }
    // El atributo de la prueba ya se puede borrar (sin productos que lo usen): la base de desarrollo no acumula basura
    if (attributeId) await admin.call('DELETE', `/products/attributes/${attributeId}`);
  }
});
