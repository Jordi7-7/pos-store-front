import { test, expect } from '@playwright/test';
import { adminApi, creds, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

interface ProfileResponse {
  branches: Array<{ id: string; name: string }>;
}
interface Attribute {
  id: string;
  name: string;
  values: Array<{ id: string; value: string }>;
}
interface ProductsPage {
  data: Array<{ id: string; name: string; variants: Array<{ id: string; sku: string; salePrice: number; stocks?: Array<{ branchId: string; quantity: number }> }> }>;
}

test.setTimeout(90_000);

test('producto variable: editar el padre, cambiar el precio de una variante y añadir otra', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const baseSku = `E2EV${stamp}`;
  const name = `Producto e2e variable ${stamp}`;

  try {
    // Preparación por API: un atributo propio con dos valores y un producto variable con dos variantes
    const branch = (await admin.call<ProfileResponse>('GET', '/auth/profile')).data.branches[0];
    expect(branch, 'la tienda de pruebas tiene sucursal').toBeTruthy();
    const attribute = (await admin.call<Attribute>('POST', '/products/attributes', { name: `E2E Talla ${stamp}` })).data;
    const values = [] as Array<{ id: string; value: string }>;
    for (const value of ['S', 'M', 'L']) {
      values.push((await admin.call<{ id: string; value: string }>('POST', '/products/attributes/values', { attributeId: attribute.id, value })).data);
    }
    const created = await admin.call('POST', '/products/variable', {
      name,
      description: 'creado por el e2e',
      baseSku,
      variants: values.slice(0, 2).map((value) => ({
        sku: `${baseSku}-${value.value}`,
        purchasePrice: 50,
        salePrice: 100,
        attributeValues: [{ attributeValueId: value.id }],
        stocks: [{ branchId: branch!.id, quantity: 5 }],
      })),
    });
    expect(created.status).toBe(201);

    await login(page);
    await page.locator('header select').selectOption({ index: 1 });
    await page.goto('/inventario/productos');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder(/Buscar por nombre, SKU/).fill(baseSku);
    await page.getByRole('button', { name: 'Buscar' }).click();
    const row = page.getByRole('row', { name: new RegExp(name) });
    await expect(row).toBeVisible();
    await row.getByTitle('Editar Ficha de Producto').click();

    // 1. Ficha del padre: cambiar el nombre ANTES de tocar las variantes. Crear una variante recarga el producto y
    //    el editor debe conservar lo escrito (antes descartaba los cambios sin guardar de la ficha del padre).
    const newName = `${name} editado`;
    await page.getByPlaceholder('Ej. Playera Oversize').fill(newName);

    // 2. Variantes: cada una muestra su combinación (defecto: el detalle las traía en otra forma y salía "Variante")
    await page.getByText(/2\. Variantes y Precios/).first().click();
    await expect(page.getByText(`E2E Talla ${stamp}: S`)).toBeVisible();
    await expect(page.getByText(`E2E Talla ${stamp}: M`)).toBeVisible();

    // Añadir una variante nueva (talla L): el diálogo solo ofrece los atributos que ya usa el producto
    await page.getByRole('button', { name: /Nueva Variante/ }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: 'Agregar Nueva Variante' });
    await dialog.locator('select').selectOption({ label: 'L' });
    await dialog.getByPlaceholder('Ej. CAM-AZU-XL').fill(`${baseSku}-L`);
    const variantCreated = page.waitForResponse((r) => /\/products\/[^/]+\/variants$/.test(r.url()) && r.request().method() === 'POST', { timeout: 15_000 });
    await dialog.getByRole('button', { name: 'Crear Variante' }).click();
    expect((await variantCreated).status()).toBe(201);
    await expect(page.getByText(`E2E Talla ${stamp}: L`)).toBeVisible();

    // 3. Cambiar el precio de venta de la primera variante
    const firstRow = page.getByRole('dialog').locator('tbody tr').first();
    await firstRow.locator('input').nth(3).fill('150', { timeout: 10_000 }); // SKU, código de barras, compra, venta, mayoreo

    const saved = page.waitForResponse((r) => /\/products\/variants\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT', { timeout: 15_000 });
    await page.getByRole('button', { name: 'Guardar Todos los Cambios' }).click();
    expect((await saved).status()).toBe(200);

    const after = (await admin.call<ProductsPage>('GET', `/products?search=${baseSku}&limit=5`)).data.data[0];
    expect(after?.name).toBe(newName);
    const prices = (after?.variants ?? []).map((variant) => variant.salePrice).sort((x, y) => x - y);
    expect(prices).toEqual([100, 100, 150]); // las dos originales (una editada) y la nueva
    expect(after?.variants.map((variant) => variant.sku).sort()).toContain(`${baseSku}-L`);
  } finally {
    const list = (await admin.call<ProductsPage>('GET', `/products?search=E2EV&limit=50`)).data.data.filter((p) => p.name.startsWith('Producto e2e variable '));
    for (const product of list) {
      for (const variant of product.variants) {
        for (const stock of variant.stocks ?? []) {
          if (Number(stock.quantity) > 0) await admin.call('POST', '/products/stock-adjustments', { branchId: stock.branchId, variantId: variant.id, quantity: Number(stock.quantity), type: 'OUT', comment: 'e2e: limpieza' });
        }
      }
      await admin.call('DELETE', `/products/${product.id}`);
    }
  }
});
