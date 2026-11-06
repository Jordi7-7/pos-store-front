import { test, expect } from '@playwright/test';
import * as XLSX from 'xlsx';
import { adminApi, creds, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

interface Profile {
  branches: Array<{ id: string }>;
}
interface ProductResponse {
  id: string;
  name: string;
  variants: Array<{ id: string; stocks?: Array<{ branchId: string; quantity: number }> }>;
}
interface ProductsPage {
  data: ProductResponse[];
}

const stockOf = (product: ProductResponse | undefined): number => (product?.variants[0]?.stocks ?? []).reduce((sum, stock) => sum + Number(stock.quantity), 0);

test('compras: registrar un ingreso sube el stock, sale en el historial y al anularlo el stock vuelve', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const sku = `E2EC${stamp}`;
  const name = `Producto e2e compra ${stamp}`;
  const invoice = `E2E-${stamp}`;
  const find = async () => (await admin.call<ProductsPage>('GET', `/products?search=${sku}&limit=5`)).data.data[0];

  try {
    const branch = (await admin.call<Profile>('GET', '/auth/profile')).data.branches[0];
    expect(branch, 'la propietaria tiene sucursal').toBeTruthy();
    const created = await admin.call('POST', '/products/simple', { name, description: '', sku, purchasePrice: 40, salePrice: 80 });
    expect(created.status).toBe(201);

    // 1. Registrar el ingreso por la pantalla (cantidad 4)
    await login(page);
    await page.locator('header select').selectOption({ index: 1 });
    await page.goto('/compras/registrar');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('Ej. Guía, FAC-123').fill(invoice);
    const skuInput = page.getByPlaceholder('Escriba SKU...').first();
    await skuInput.fill(sku);
    await skuInput.press('Enter');
    await expect(page.getByText(name)).toBeVisible();
    await page.locator('[data-row="0"][data-col="quantity"]').fill('4');
    await expect(page.getByText(/\$\s?160\.00/).first()).toBeVisible(); // 4 × 40, con la moneda de la tienda
    const registered = page.waitForResponse((r) => r.url().endsWith('/purchases') && r.request().method() === 'POST');
    await page.getByRole('button', { name: /Registrar Ingreso \(Kardex\)/ }).click();
    expect((await registered).status()).toBe(201);
    expect(stockOf(await find())).toBe(4);

    // 2. Aparece en el historial con su total
    await page.goto('/compras/historial');
    await page.waitForLoadState('networkidle');
    const card = page.locator('div.rounded-2xl', { hasText: invoice }).first();
    await expect(card).toBeVisible();
    await expect(card).toContainText(/\$\s?160\.00/);

    // 3. Anularlo: el stock vuelve a 0
    await card.getByRole('button', { name: 'Anular' }).click();
    const cancelled = page.waitForResponse((r) => /\/purchases\/[^/]+\/cancel$/.test(r.url()) && r.request().method() === 'PATCH');
    await card.getByRole('button', { name: 'Sí, anular ingreso' }).click();
    expect((await cancelled).status()).toBeLessThan(300);
    expect(stockOf(await find())).toBe(0);
  } finally {
    // Limpieza: sacar cualquier existencia que quede y borrar el producto de prueba.
    const leftovers = (await admin.call<ProductsPage>('GET', '/products?search=E2EC&limit=50')).data.data.filter((p) => p.name.startsWith('Producto e2e compra '));
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

test('compras: la carga masiva por Excel valida los SKU, marca los que no existen y ingresa el stock', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const sku = `E2EC${stamp}`;
  const name = `Producto e2e compra ${stamp}`;
  const find = async () => (await admin.call<ProductsPage>('GET', `/products?search=${sku}&limit=5`)).data.data[0];
  const excel = (rows: Array<Record<string, string | number>>) => {
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Ingresos');
    return Buffer.from(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Uint8Array);
  };

  try {
    expect((await admin.call('POST', '/products/simple', { name, description: '', sku, purchasePrice: 25, salePrice: 50 })).status).toBe(201);
    await login(page);
    await page.locator('header select').selectOption({ index: 1 });
    await page.goto('/compras/registrar');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /Carga Masiva/ }).click();
    const dialog = page.getByRole('dialog');

    // 1. Archivo con un SKU inexistente: se marca y no deja confirmar
    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'ingresos.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: excel([{ SKU: sku, Cantidad: 6 }, { SKU: `NOEXISTE${stamp}`, Cantidad: 1 }]),
    });
    await expect(dialog.getByText(/SKU\(s\) no válidos/)).toBeVisible();
    await expect(dialog.getByRole('button', { name: /Confirmar e Ingresar/ })).toBeDisabled();

    // 2. Cambiar de archivo: solo el SKU bueno, y se ingresa
    await dialog.getByRole('button', { name: 'Cambiar Archivo' }).click();
    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'ingresos.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: excel([{ SKU: sku, Cantidad: 6 }]),
    });
    await expect(dialog.getByText('¡Validación exitosa!')).toBeVisible();
    const imported = page.waitForResponse((r) => r.url().endsWith('/purchases/import') && r.request().method() === 'POST');
    await dialog.getByRole('button', { name: /Confirmar e Ingresar/ }).click();
    expect((await imported).status()).toBe(201);
    expect(stockOf(await find())).toBe(6);
  } finally {
    const leftovers = (await admin.call<ProductsPage>('GET', '/products?search=E2EC&limit=50')).data.data.filter((p) => p.name.startsWith('Producto e2e compra '));
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
