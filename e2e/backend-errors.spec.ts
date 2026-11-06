import { test, expect } from '@playwright/test';
import { adminApi, creds, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

interface ProductsPage {
  data: Array<{ id: string; name: string; variants: Array<{ id: string; stocks?: Array<{ branchId: string; quantity: number }> }> }>;
}

test('un SKU repetido al crear un producto muestra el texto del catálogo (409 SKU_TAKEN) con el SKU', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const sku = `E2ED${stamp}`;
  const name = `Producto e2e dup ${stamp}`;
  expect((await admin.call('POST', '/products/simple', { name, description: '', sku, purchasePrice: 10, salePrice: 20 })).status).toBe(201);

  try {
    await login(page);
    await page.locator('header select').selectOption({ index: 1 });
    await page.goto('/inventario/crear');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/Código SKU/).fill(sku);
    await page.getByLabel(/Nombre del Producto/).fill(`${name} copia`);
    await page.getByLabel(/^Compra/).fill('10');
    await page.getByLabel(/^Venta/).fill('20');
    await page.getByLabel(/Stock Inicial/).fill('1');
    const rejected = page.waitForResponse((r) => r.url().endsWith('/products/simple') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Crear Producto e Inventario' }).click();
    expect((await rejected).status()).toBe(409);
    await expect(page.getByText(new RegExp(`El SKU ${sku} ya está registrado en otra variante`))).toBeVisible();
  } finally {
    const leftovers = (await admin.call<ProductsPage>('GET', '/products?search=E2ED&limit=50')).data.data.filter((p) => p.name.startsWith('Producto e2e dup '));
    for (const product of leftovers) await admin.call('DELETE', `/products/${product.id}`);
  }
});

test('borrar un producto con existencias devuelve 409 PRODUCT_HAS_STOCK', async ({ request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const sku = `E2EH${stamp}`;
  const branch = (await admin.call<{ branches: Array<{ id: string }> }>('GET', '/auth/profile')).data.branches[0];
  const created = await admin.call<{ id: string }>('POST', '/products/simple', {
    name: `Producto e2e stock ${stamp}`, description: '', sku, purchasePrice: 10, salePrice: 20, stocks: [{ branchId: branch?.id, quantity: 2 }],
  });
  expect(created.status).toBe(201);

  try {
    const refused = await admin.call<{ code: string }>('DELETE', `/products/${created.data.id}`);
    expect(refused.status).toBe(409);
    expect(refused.data.code).toBe('PRODUCT_HAS_STOCK');
  } finally {
    const product = (await admin.call<ProductsPage>('GET', `/products?search=${sku}&limit=5`)).data.data[0];
    for (const variant of product?.variants ?? []) {
      for (const stock of variant.stocks ?? []) {
        if (Number(stock.quantity) > 0) await admin.call('POST', '/products/stock-adjustments', { branchId: stock.branchId, variantId: variant.id, quantity: Number(stock.quantity), type: 'OUT', comment: 'e2e: limpieza' });
      }
    }
    if (product) await admin.call('DELETE', `/products/${product.id}`);
  }
});
