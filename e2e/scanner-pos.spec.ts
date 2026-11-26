import { test, expect } from '@playwright/test';
import { adminApi, cashier, creds, emptyStock, fakeCameraArgs, pinLogin, resetCashRegister, writeFakeCameraVideo } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass || !cashier.pin, 'Faltan credenciales E2E en .env.e2e.local');

const REGISTER = 'Caja Principal 1';
const SHARED_SKU = '001'; // en el tenant de pruebas lo comparten varios productos: tras leerlo hay que elegir
const PRODUCT = 'PANTALON VARIOS LISO';
const stamp = Date.now().toString().slice(-8);
const UNIQUE_SKU = `E2EPOS${stamp}`;
const UNIQUE_NAME = `Producto e2e POS ${stamp}`;

// La cámara falsa muestra primero el código único y después el compartido
test.use({ launchOptions: { args: fakeCameraArgs(writeFakeCameraVideo([UNIQUE_SKU, SHARED_SKU], `pos-${stamp}`)) }, permissions: ['camera'] });

test.setTimeout(90_000);

test('POS con la cámara: un código único se agrega al carrito y el escáner sigue; uno con varias coincidencias lo cierra y deja elegir', async ({ page, request }) => {
  const admin = await adminApi(request);
  const register = await resetCashRegister(request, REGISTER);
  try {
    expect((await admin.call('POST', '/products/simple', { name: UNIQUE_NAME, description: '', sku: UNIQUE_SKU, purchasePrice: 4, salePrice: 25, stocks: [{ branchId: register.branchId, quantity: 5 }] })).status).toBeLessThan(300);

    await pinLogin(page);
    await page.getByRole('button', { name: /Apertura de Caja/ }).click();
    await page.getByText(REGISTER).click();
    await page.getByPlaceholder('0.00').fill('100');
    const opened = page.waitForResponse((r) => r.url().endsWith('/sales/cash-sessions/open') && r.request().method() === 'POST');
    await page.getByRole('button', { name: /Abrir Turno de Caja/ }).click();
    expect((await opened).status()).toBe(201);

    // El primer código es único: se agrega al carrito y el escáner SIGUE abierto
    await page.getByRole('button', { name: 'Escanear con la cámara' }).click();
    const scanner = page.getByRole('dialog').filter({ hasText: 'Escanear productos para la venta' });
    await expect(scanner.getByRole('list', { name: 'Últimas lecturas' }).getByText(`${UNIQUE_NAME} agregado`)).toBeVisible({ timeout: 15_000 });
    await expect(scanner).toBeVisible();

    // El segundo tiene varias coincidencias: el escáner se cierra y aparece la lista para elegir
    await expect(page.getByText('Múltiples coincidencias encontradas')).toBeVisible({ timeout: 15_000 });
    await expect(scanner).toBeHidden();
    await page.getByText(PRODUCT).first().click();

    // Los dos quedan en el carrito
    await expect(page.getByText(UNIQUE_NAME).first()).toBeVisible();
    await expect(page.getByText(PRODUCT).first()).toBeVisible();
    await expect(page.getByText('MONTO TOTAL A COBRAR')).toBeVisible();
  } finally {
    await resetCashRegister(request, REGISTER);
    const products = (await admin.call<{ data: Array<{ id: string; variants: Array<{ id: string; stocks?: Array<{ branchId: string; quantity: number }> }> }> }>('GET', `/products?search=${UNIQUE_SKU}&limit=5`)).data.data;
    for (const product of products) {
      for (const variant of product.variants) for (const stock of variant.stocks ?? []) if (Number(stock.quantity) > 0) await emptyStock(admin, stock.branchId, variant.id, Number(stock.quantity));
      await admin.call('DELETE', `/products/${product.id}`);
    }
  }
});
