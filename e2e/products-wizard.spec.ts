import { test, expect } from '@playwright/test';
import { adminApi, creds, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

interface Attribute {
  id: string;
  name: string;
}
interface ProductsPage {
  data: Array<{ id: string; name: string; baseSku: string; variants: Array<{ id: string; sku: string; purchasePrice: number; salePrice: number; stocks?: Array<{ branchId: string; quantity: number }> }> }>;
}

test.setTimeout(90_000);

test('asistente de producto compuesto: ficha, atributos, matriz con valores en bloque y guardado', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const baseSku = `E2EW${stamp}`;
  const name = `Producto e2e asistente ${stamp}`;
  const valueA = `A${stamp}`;
  const valueB = `B${stamp}`;
  let attributeId = '';

  try {
    // Preparación por API: un atributo propio con tres valores (se eligen dos)
    const attribute = (await admin.call<Attribute>('POST', '/products/attributes', { name: `E2E Atributo ${stamp}` })).data;
    attributeId = attribute.id;
    for (const value of [valueA, valueB, `C${stamp}`]) {
      await admin.call('POST', '/products/attributes/values', { attributeId, value });
    }

    await login(page);
    await page.locator('header select').selectOption({ index: 1 });
    await page.goto('/inventario/crear-compuesto');
    await page.waitForLoadState('networkidle');

    // 1. Ficha: sin nombre no deja avanzar
    await page.getByRole('button', { name: /Continuar a Selección de Atributos/ }).click();
    await expect(page.getByText('El nombre del producto es obligatorio')).toBeVisible();
    await page.getByLabel(/Código SKU Base/).fill(baseSku.toLowerCase()); // el campo lo pasa a mayúsculas
    await page.getByLabel(/Nombre del Producto/).fill(name);
    await page.getByRole('button', { name: /Continuar a Selección de Atributos/ }).click();

    // 2. Atributos: dos valores dan dos combinaciones
    await page.getByRole('button', { name: valueA, exact: true }).click();
    await page.getByRole('button', { name: valueB, exact: true }).click();
    await page.getByRole('button', { name: /Generar Variantes \(2\)/ }).click();

    // 3. Matriz: valores en bloque para todas las variantes
    await expect(page.getByRole('button', { name: /Guardar Producto Compuesto \(2 variantes\)/ })).toBeVisible();
    await page.getByPlaceholder('0.00').nth(0).fill('40'); // P. Compra
    await page.getByPlaceholder('0.00').nth(1).fill('90'); // P. Venta
    await page.getByPlaceholder('0', { exact: true }).fill('3'); // Stock inicial
    await page.getByRole('button', { name: 'Aplicar a Todas' }).click();

    const created = page.waitForResponse((r) => r.url().endsWith('/products/variable') && r.request().method() === 'POST');
    await page.getByRole('button', { name: /Guardar Producto Compuesto/ }).click();
    expect((await created).status()).toBe(201);

    const product = (await admin.call<ProductsPage>('GET', `/products?search=${baseSku}&limit=5`)).data.data[0];
    expect(product?.name).toBe(name);
    expect(product?.baseSku).toBe(baseSku);
    expect(product?.variants.map((v) => v.sku).sort()).toEqual([`${baseSku}-1`, `${baseSku}-2`]);
    for (const variant of product?.variants ?? []) {
      expect(variant).toMatchObject({ purchasePrice: 40, salePrice: 90 });
      expect(Number(variant.stocks?.[0]?.quantity)).toBe(3);
    }
  } finally {
    const list = (await admin.call<ProductsPage>('GET', '/products?search=E2EW&limit=50')).data.data.filter((p) => p.name.startsWith('Producto e2e asistente '));
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
