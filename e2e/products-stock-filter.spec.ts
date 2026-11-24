import { test, expect } from '@playwright/test';
import { adminApi, creds, emptyStock, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

interface ProductsPage {
  data: Array<{ id: string; name: string; variants: Array<{ id: string; stocks?: Array<{ branchId: string; quantity: number }> }> }>;
}

test('el selector de existencias filtra el listado en el servidor: con existencias, en cero y todas', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const withStock = `Producto e2e filtro CON ${stamp}`;
  const atZero = `Producto e2e filtro CERO ${stamp}`;

  try {
    await login(page);
    await page.waitForLoadState('networkidle');
    await page.locator('header select').selectOption({ index: 1 }); // una sucursal concreta: el filtro mira sus existencias
    const branchId = await page.locator('header select').inputValue();
    const create = (name: string, sku: string, quantity: number) =>
      admin.call('POST', '/products/simple', { name, description: '', sku, purchasePrice: 4, salePrice: 10, stocks: [{ branchId, quantity }] });
    expect((await create(withStock, `E2EF${stamp}1`, 3)).status).toBeLessThan(300);
    expect((await create(atZero, `E2EF${stamp}0`, 0)).status).toBeLessThan(300);

    await page.goto('/inventario/productos');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder(/Buscar por nombre, SKU/).fill(`filtro CON ${stamp}`);
    await page.getByPlaceholder(/Buscar por nombre, SKU/).press('Enter');
    await expect(page.getByText(withStock).first()).toBeVisible();
    await page.getByPlaceholder(/Buscar por nombre, SKU/).fill(`${stamp}`);
    await page.getByPlaceholder(/Buscar por nombre, SKU/).press('Enter');
    await expect(page.getByText(withStock).first()).toBeVisible();
    await expect(page.getByText(atZero).first()).toBeVisible();

    const select = page.getByLabel('Existencias');
    await expect(select.locator('option')).toHaveText(['Todas las existencias', 'Con existencias', 'Existencia en cero', 'Existencia en negativo']);

    await select.selectOption('ZERO');
    await expect(page.getByText(atZero).first()).toBeVisible();
    await expect(page.getByText(withStock)).toHaveCount(0);

    await select.selectOption('IN_STOCK');
    await expect(page.getByText(withStock).first()).toBeVisible();
    await expect(page.getByText(atZero)).toHaveCount(0);

    await select.selectOption('NEGATIVE');
    await expect(page.getByText(withStock)).toHaveCount(0);
    await expect(page.getByText(atZero)).toHaveCount(0);

    await select.selectOption('');
    await expect(page.getByText(withStock).first()).toBeVisible();
    await expect(page.getByText(atZero).first()).toBeVisible();
  } finally {
    const leftovers = (await admin.call<ProductsPage>('GET', '/products?search=E2EF&limit=50')).data.data.filter((p) => p.name.startsWith('Producto e2e filtro '));
    for (const leftover of leftovers) {
      for (const variant of leftover.variants) {
        for (const stock of variant.stocks ?? []) {
          if (Number(stock.quantity) > 0) await emptyStock(admin, stock.branchId, variant.id, Number(stock.quantity));
        }
      }
      await admin.call('DELETE', `/products/${leftover.id}`);
    }
  }
});
