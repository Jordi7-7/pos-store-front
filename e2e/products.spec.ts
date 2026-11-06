import { test, expect } from '@playwright/test';
import { adminApi, creds, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

interface ProductResponse {
  id: string;
  name: string;
  variants: Array<{ id: string; sku: string; salePrice: number; stocks?: Array<{ branchId: string; quantity: number }> }>;
}
interface ProductsPage {
  data: ProductResponse[];
}

const stockOf = (product: ProductResponse | undefined): number => (product?.variants[0]?.stocks ?? []).reduce((sum, stock) => sum + Number(stock.quantity), 0);

test('catálogo: crear un producto, verlo en la lista, editar su precio, ajustar su stock y borrarlo', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const sku = `E2E${stamp}`;
  const name = `Producto e2e ${stamp}`;
  const find = async () => (await admin.call<ProductsPage>('GET', `/products?search=${sku}&limit=5`)).data.data[0];

  try {
    // 1. Crear (el SKU se escribe en minúsculas: el servidor lo guarda en MAYÚSCULAS)
    await login(page);
    await page.locator('header select').selectOption({ index: 1 }); // una sucursal concreta: no "Todas"
    await page.goto('/inventario/crear');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/Código SKU/).fill(sku.toLowerCase());
    await page.getByLabel(/Nombre del Producto/).fill(name);
    await page.getByLabel(/^Compra/).fill('60');
    await page.getByLabel(/^Venta/).fill('100');
    await page.getByLabel(/Stock Inicial/).fill('10');
    const created = page.waitForResponse((r) => r.url().endsWith('/products/simple') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Crear Producto e Inventario' }).click();
    expect((await created).status()).toBe(201);

    const product = await find();
    expect(product, 'el producto existe en el backend').toBeTruthy();
    expect(product?.variants[0]).toMatchObject({ sku, salePrice: 100 });
    expect(stockOf(product)).toBe(10);

    // 2. Verlo en la lista, con el precio en la moneda de la tienda
    await page.goto('/inventario/productos');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder(/Buscar por nombre, SKU/).fill(sku);
    await page.getByRole('button', { name: 'Buscar' }).click();
    const row = page.getByRole('row', { name: new RegExp(name) });
    await expect(row).toBeVisible();
    await expect(row).toContainText(/\$\s?100\.00/);

    // 3. Editar el precio de venta
    await row.getByTitle('Editar Ficha de Producto').click();
    await page.getByLabel(/^Venta/).fill('120');
    const updated = page.waitForResponse((r) => /\/products\/[^/]+(\/simple)?$/.test(r.url()) && r.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    expect((await updated).status()).toBe(200);
    expect((await find())?.variants[0]?.salePrice).toBe(120);

    // 4. Ajustar el stock (entrada de 5): 10 → 15
    await page.goto('/inventario/productos');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder(/Buscar por nombre, SKU/).fill(sku);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.getByRole('row', { name: new RegExp(name) }).click();
    await page.getByRole('tab', { name: 'Ajuste' }).click();
    await page.getByLabel('Cantidad').fill('5');
    const adjusted = page.waitForResponse((r) => r.url().endsWith('/products/stock-adjustments') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Registrar ajuste' }).click();
    expect((await adjusted).status()).toBe(201);
    expect(stockOf(await find())).toBe(15);
  } finally {
    // Limpieza: el producto de prueba no debe quedar en el catálogo, aunque falle algún paso.
    // El backend no deja borrar un producto con existencias: se sacan con una salida y luego se borra.
    const leftovers = (await admin.call<ProductsPage>('GET', '/products?search=E2E&limit=50')).data.data.filter((p) => p.name.startsWith('Producto e2e '));
    for (const leftover of leftovers) {
      for (const variant of leftover.variants) {
        for (const stock of variant.stocks ?? []) {
          if (Number(stock.quantity) > 0) {
            await admin.call('POST', '/products/stock-adjustments', { branchId: stock.branchId, variantId: variant.id, quantity: Number(stock.quantity), type: 'OUT', comment: 'e2e: limpieza' });
          }
        }
      }
      await admin.call('DELETE', `/products/${leftover.id}`);
    }
  }
});
