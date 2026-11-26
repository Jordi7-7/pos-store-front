import { test, expect } from '@playwright/test';
import { adminApi, creds, emptyStock, fakeCameraArgs, login, writeFakeCameraVideo } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

interface ProductsPage {
  data: Array<{ id: string; name: string; variants: Array<{ id: string; stocks?: Array<{ branchId: string; quantity: number }> }> }>;
}

const stamp = Date.now().toString().slice(-8);
const sku = `E2ESCAN${stamp}`;

test.use({
  launchOptions: { args: fakeCameraArgs(writeFakeCameraVideo(sku, `scan-${stamp}`)) },
  permissions: ['camera'],
});

test.setTimeout(90_000);

test('escáner con la cámara: lee un código y lo busca en el listado de productos y lo agrega a un ingreso de mercancía', async ({ page, request }) => {
  const admin = await adminApi(request);
  const name = `Producto e2e escáner ${stamp}`;

  try {
    await login(page);
    await page.locator('header select').selectOption({ index: 1 });
    const branchId = await page.locator('header select').inputValue();
    expect((await admin.call('POST', '/products/simple', { name, description: '', sku, purchasePrice: 4, salePrice: 10, stocks: [{ branchId, quantity: 0 }] })).status).toBeLessThan(300);

    // 1. Listado de productos: un código leído busca al instante
    await page.goto('/inventario/productos');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Escanear con la cámara' }).click();
    // Sin modo continuo, la ventana se cierra sola al leer el código (con la cámara falsa es casi al instante)
    await expect(page.getByPlaceholder(/Buscar por nombre, SKU/)).toHaveValue(sku, { timeout: 15_000 });
    await expect(page.getByRole('dialog').filter({ hasText: 'Escanear código de barras' })).toBeHidden();
    await expect(page.getByText(name).first()).toBeVisible();

    // 2. Ingreso de mercancía: el modo continuo agrega el producto y sigue abierto hasta pulsar «Listo»
    await page.goto('/compras/registrar');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Escanear/ }).first().click();
    const continuous = page.getByRole('dialog').filter({ hasText: 'Escanear productos' });
    await expect(continuous.getByRole('list', { name: 'Últimas lecturas' }).getByText(`${name} agregado`)).toBeVisible({ timeout: 15_000 });
    // También se puede teclear un código que la cámara no lee: uno que no existe se avisa sin cerrar
    await continuous.getByLabel('Escribir el código a mano').fill('NO-EXISTE-123');
    await continuous.getByRole('button', { name: 'Agregar' }).click();
    await expect(continuous.getByText('El código NO-EXISTE-123 no existe').first()).toBeVisible();
    await expect(continuous).toBeVisible();
    await continuous.getByRole('button', { name: 'Listo' }).click();
    await expect(page.getByText(name).first()).toBeVisible();

    // 3. Al cerrar, la cámara se apaga: ningún video conserva su transmisión
    await expect.poll(() => page.evaluate(() => Array.from(document.querySelectorAll('video')).filter((video) => video.srcObject !== null).length)).toBe(0);
  } finally {
    const products = (await admin.call<ProductsPage>('GET', `/products?search=${sku}&limit=5`)).data.data;
    for (const product of products) {
      for (const variant of product.variants) for (const stock of variant.stocks ?? []) if (Number(stock.quantity) > 0) await emptyStock(admin, stock.branchId, variant.id, Number(stock.quantity));
      await admin.call('DELETE', `/products/${product.id}`);
    }
  }
});
