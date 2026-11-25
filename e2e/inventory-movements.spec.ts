import { test, expect } from '@playwright/test';
import { adminApi, creds, emptyStock, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

interface ProductsPage {
  data: Array<{ id: string; name: string; variants: Array<{ id: string; sku: string; stocks?: Array<{ branchId: string; quantity: number }> }> }>;
}

test('movimientos de inventario: entrada, salida con aviso de stock, conteo con cambio de stock en medio, y el historial con sus documentos', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const sku = `E2EM${stamp}`;
  const name = `Producto e2e mov ${stamp}`;
  const find = async () => (await admin.call<ProductsPage>('GET', `/products?search=${sku}&limit=5`)).data.data[0];
  const stockOf = async (branchId: string): Promise<number> => Number((await find())?.variants[0]?.stocks?.find((s) => s.branchId === branchId)?.quantity ?? 0);
  const confirmed = (path: string) => page.waitForResponse((r) => r.url().endsWith(path) && r.request().method() === 'POST');

  try {
    await login(page);
    await page.locator('header select').selectOption({ index: 1 }); // una sucursal concreta: no "Todas"
    const branchId = await page.locator('header select').inputValue();
    expect((await admin.call('POST', '/products/simple', { name, description: '', sku, purchasePrice: 4, salePrice: 10, stocks: [{ branchId, quantity: 10 }] })).status).toBe(201);
    expect(await stockOf(branchId)).toBe(10);

    // 0. Desde un formulario se puede volver al historial sin registrar nada, con el botón y con las migas de pan
    await page.goto('/inventario/movimientos');
    await page.getByRole('button', { name: 'Nuevo movimiento' }).click();
    await page.getByRole('menuitem', { name: 'Entrada de inventario' }).click();
    await expect(page).toHaveURL(/\/inventario\/entrada/);
    await expect(page.getByRole('navigation', { name: 'Ubicación' })).toContainText('Inventario');
    await page.getByRole('button', { name: 'Volver a movimientos' }).click();
    await expect(page).toHaveURL(/\/inventario\/movimientos/);
    await page.goto('/inventario/salida');
    await page.getByRole('navigation', { name: 'Ubicación' }).getByRole('link', { name: 'Movimientos' }).click();
    await expect(page).toHaveURL(/\/inventario\/movimientos/);

    // 1. Entrada de 5 unidades: 10 → 15
    await page.goto('/inventario/entrada');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Motivo').selectOption('DONACION');
    await page.getByLabel('SKU del producto').fill(sku);
    await page.getByRole('button', { name: 'Agregar' }).click();
    await page.getByLabel(`Cantidad de ${sku}`).fill('5');
    const entry = confirmed('/products/inventory-documents');
    await page.getByRole('button', { name: 'Confirmar entrada' }).click();
    expect((await entry).status()).toBe(201);
    await expect(page).toHaveURL(/\/inventario\/movimientos/);
    expect(await stockOf(branchId)).toBe(15);

    // 2. Salida: pedir más de lo que hay avisa y bloquea; con una cantidad válida, 15 → 12
    await page.goto('/inventario/salida');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Motivo').selectOption('MERMA');
    await page.getByLabel('SKU del producto').fill(sku);
    await page.getByRole('button', { name: 'Agregar' }).click();
    await page.getByLabel(`Cantidad de ${sku}`).fill('20');
    await expect(page.getByText('Solo hay 15')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirmar salida' })).toBeDisabled();
    await page.getByLabel(`Cantidad de ${sku}`).fill('3');
    // Toda salida exige un comentario de verdad: sin él no se puede confirmar
    await expect(page.getByRole('button', { name: 'Confirmar salida' })).toBeDisabled();
    await page.getByLabel(/Comentario/).fill('Se mojó en bodega');
    await expect(page.getByRole('button', { name: 'Confirmar salida' })).toBeEnabled();
    const exit = confirmed('/products/inventory-documents');
    await page.getByRole('button', { name: 'Confirmar salida' }).click();
    expect((await exit).status()).toBe(201);
    expect(await stockOf(branchId)).toBe(12);

    // 3. Conteo: el sistema decía 12 y se contaron 10 → la diferencia −2 se calcula sola
    await page.goto('/inventario/conteo');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('SKU del producto').fill(sku);
    await page.getByRole('button', { name: 'Agregar' }).click();
    await page.getByLabel(`Contado de ${sku}`).fill('10');
    await expect(page.getByRole('row', { name: new RegExp(sku) })).toContainText('-2');
    const count = confirmed('/products/stock-counts');
    await page.getByRole('button', { name: 'Confirmar conteo' }).click();
    expect((await count).status()).toBe(201);
    expect(await stockOf(branchId)).toBe(10);

    // 4. Conteo con el stock cambiado en medio: se agrega viendo 10, entra 1 por otro lado (11) y se cuentan 8
    await page.goto('/inventario/conteo');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('SKU del producto').fill(sku);
    await page.getByRole('button', { name: 'Agregar' }).click();
    await expect(page.getByRole('row', { name: new RegExp(sku) })).toBeVisible();
    const variantId = (await find())?.variants[0]?.id;
    expect(variantId, 'la variante existe').toBeTruthy();
    expect((await admin.call('POST', '/products/inventory-documents', { branchId, kind: 'ENTRY', reason: 'DONACION', lines: [{ variantId, quantity: 1 }] })).status).toBe(201);
    await page.getByLabel(`Contado de ${sku}`).fill('8');
    const stale = confirmed('/products/stock-counts');
    await page.getByRole('button', { name: 'Confirmar conteo' }).click();
    expect((await stale).status()).toBe(409); // STOCK_CHANGED_SINCE_COUNT
    await expect(page.getByRole('alert')).toContainText('El stock cambió mientras contabas');
    await expect(page.getByRole('alert')).toContainText('veías 10 y ahora hay 11');
    expect(await stockOf(branchId)).toBe(11); // no se tocó nada
    const applied = confirmed('/products/stock-counts');
    await page.getByRole('button', { name: 'Aplicar de todos modos' }).click();
    expect((await applied).status()).toBe(201);
    expect(await stockOf(branchId)).toBe(9); // 11 de ahora + la diferencia contada (8 − 10)

    // 5. El historial muestra los documentos de la prueba con su número
    await page.goto('/inventario/movimientos');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder(/Buscar por producto o SKU/).fill(sku);
    await expect(page.getByRole('cell', { name: /^ENT-\d{6}/ }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: /^SAL-\d{6}/ }).first()).toBeVisible();
    await expect(page.getByRole('cell', { name: /^CNT-\d{6}/ }).first()).toBeVisible();
    await expect(page.getByText('Merma o caducidad')).toBeVisible();
    await expect(page.getByText('Conteo físico').first()).toBeVisible();

    // El número del documento lo abre: cabecera completa (tipo, motivo, quién, comentario) y todas sus líneas con costo y saldo
    await page.getByRole('button', { name: /^SAL-\d{6}$/ }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Salida de inventario')).toBeVisible();
    await expect(dialog.getByText('Merma o caducidad')).toBeVisible();
    await expect(dialog.getByText('Se mojó en bodega')).toBeVisible();
    await expect(dialog.getByText(sku)).toBeVisible();
    await expect(dialog.getByText('-3')).toBeVisible();
    await expect(dialog.getByText('1 producto(s) · 3 unidad(es)')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);

    // Vista por documentos: una fila por documento, con la misma búsqueda (por el SKU de alguna línea); se abre con clic en la fila
    await page.getByRole('button', { name: 'Documentos' }).click();
    await expect(page.getByRole('button', { name: /^ENT-\d{6}$/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^SAL-\d{6}$/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^CNT-\d{6}$/ }).first()).toBeVisible();
    await page.getByLabel('Tipo de documento').selectOption('EXIT');
    await expect(page.getByRole('button', { name: /^ENT-\d{6}$/ })).toHaveCount(0);
    await page.getByRole('row', { name: /SAL-\d{6}/ }).first().click();
    await expect(page.getByRole('dialog').getByText('Se mojó en bodega')).toBeVisible();
    await page.keyboard.press('Escape');
  } finally {
    // Limpieza: el backend no deja borrar un producto con existencias, así que se sacan antes de borrarlo.
    const leftovers = (await admin.call<ProductsPage>('GET', '/products?search=E2EM&limit=50')).data.data.filter((p) => p.name.startsWith('Producto e2e mov '));
    for (const leftover of leftovers) {
      for (const variant of leftover.variants) {
        for (const stock of variant.stocks ?? []) {
          if (Number(stock.quantity) > 0) {
            await admin.call('POST', '/products/inventory-documents', { branchId: stock.branchId, kind: 'EXIT', reason: 'MERMA', comment: 'e2e: limpieza', lines: [{ variantId: variant.id, quantity: Number(stock.quantity) }] });
          }
        }
      }
      await admin.call('DELETE', `/products/${leftover.id}`);
    }
  }
});

test('conteo: cargar los productos de una categoría trae solo los de ella, los que no se cuentan no se tocan y se confirma lo contado', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const sku = `E2EL${stamp}`;
  const skuUncounted = `E2EN${stamp}`;
  const find = async (search: string) => (await admin.call<ProductsPage>('GET', `/products?search=${search}&limit=5`)).data.data[0];
  const stockOf = async (search: string, branchId: string): Promise<number> => Number((await find(search))?.variants[0]?.stocks?.find((s) => s.branchId === branchId)?.quantity ?? 0);

  // Las categorías no se pueden borrar: se reutiliza siempre la misma para no ensuciar el catálogo en cada corrida
  const categoryName = 'e2e-conteo';
  const categories = (await admin.call<Array<{ id: string; name: string }>>('GET', '/products/categories')).data;
  const categoryId = categories.find((category) => category.name === categoryName)?.id ?? (await admin.call<{ id: string }>('POST', '/products/categories', { name: categoryName })).data.id;
  expect(categoryId, 'la categoría de prueba existe').toBeTruthy();

  try {
    await login(page);
    await page.locator('header select').selectOption({ index: 1 });
    const branchId = await page.locator('header select').inputValue();
    for (const [code, quantity] of [[sku, 10], [skuUncounted, 6]] as const) {
      expect((await admin.call('POST', '/products/simple', { name: `Producto e2e conteo ${code}`, description: '', sku: code, purchasePrice: 4, salePrice: 10, categoryId, stocks: [{ branchId, quantity }] })).status).toBe(201);
    }

    await page.goto('/inventario/conteo');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Categoría a cargar').selectOption(categoryId);
    await page.getByRole('button', { name: 'Cargar productos' }).click();
    await expect(page.getByRole('row', { name: new RegExp(sku) })).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(skuUncounted) })).toBeVisible();
    await expect(page.getByRole('row', { name: new RegExp(sku) })).toContainText('10'); // lo que dice el sistema

    // Solo se cuenta uno de los dos: el otro queda "sin contar" y no se envía
    await page.getByLabel(`Contado de ${sku}`).fill('9');
    await expect(page.getByText(/\d+ sin contar \(no se tocan\)/)).toBeVisible(); // los de la categoría que no se contaron (al menos el segundo producto)
    const count = page.waitForResponse((r) => r.url().endsWith('/products/stock-counts') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Confirmar conteo' }).click();
    const response = await count;
    expect(response.status()).toBe(201);
    expect(((await response.json()) as { lines: unknown[] }).lines).toHaveLength(1);
    expect(await stockOf(sku, branchId)).toBe(9);
    expect(await stockOf(skuUncounted, branchId)).toBe(6); // no se tocó
  } finally {
    const leftovers = (await admin.call<ProductsPage>('GET', '/products?search=E2E&limit=50')).data.data.filter((p) => p.name.startsWith('Producto e2e conteo '));
    for (const leftover of leftovers) {
      for (const variant of leftover.variants) {
        for (const stock of variant.stocks ?? []) {
          if (Number(stock.quantity) > 0) {
            await admin.call('POST', '/products/inventory-documents', { branchId: stock.branchId, kind: 'EXIT', reason: 'MERMA', comment: 'e2e: limpieza', lines: [{ variantId: variant.id, quantity: Number(stock.quantity) }] });
          }
        }
      }
      await admin.call('DELETE', `/products/${leftover.id}`);
    }
  }
});

test('traslado entre sucursales: avisa si no alcanza en el origen, mueve el stock de una a otra y el historial dice hacia dónde fue', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const sku = `E2ET${stamp}`;
  const find = async () => (await admin.call<ProductsPage>('GET', `/products?search=${sku}&limit=5`)).data.data[0];
  const stockOf = async (branchId: string): Promise<number> => Number((await find())?.variants[0]?.stocks?.find((s) => s.branchId === branchId)?.quantity ?? 0);

  try {
    await login(page);
    await page.locator('header select').selectOption({ index: 1 }); // el origen es la sucursal elegida arriba
    const originId = await page.locator('header select').inputValue();
    expect((await admin.call('POST', '/products/simple', { name: `Producto e2e traslado ${stamp}`, description: '', sku, purchasePrice: 4, salePrice: 10, stocks: [{ branchId: originId, quantity: 10 }] })).status).toBe(201);

    await page.goto('/inventario/traslado');
    await page.waitForLoadState('networkidle');
    // El origen no se ofrece como destino
    await page.getByLabel('Sucursal de destino').selectOption({ index: 1 });
    const destinationId = await page.getByLabel('Sucursal de destino').inputValue();
    expect(destinationId).not.toBe(originId);
    await page.getByLabel('SKU del producto').fill(sku);
    await page.getByRole('button', { name: 'Agregar' }).click();

    // Pedir más de lo que hay en el origen avisa y bloquea; con una cantidad válida se confirma
    await page.getByLabel(`Cantidad de ${sku}`).fill('20');
    await expect(page.getByText('Solo hay 10')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirmar traslado' })).toBeDisabled();
    await page.getByLabel(`Cantidad de ${sku}`).fill('4');
    const transfer = page.waitForResponse((r) => r.url().endsWith('/products/stock-transfers') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Confirmar traslado' }).click();
    expect((await transfer).status()).toBe(201);
    await expect(page).toHaveURL(/\/inventario\/movimientos/);
    expect(await stockOf(originId)).toBe(6);
    expect(await stockOf(destinationId)).toBe(4);

    // El historial de la sucursal de origen muestra la salida del traslado y hacia dónde fue
    await page.getByPlaceholder(/Buscar por producto o SKU/).fill(sku);
    await expect(page.getByRole('cell', { name: /^TRS-\d{6}/ }).first()).toBeVisible();
    await expect(page.getByText(/^hacia /).first()).toBeVisible();
    await expect(page.getByText('Traslado').first()).toBeVisible();
  } finally {
    const leftovers = (await admin.call<ProductsPage>('GET', '/products?search=E2ET&limit=50')).data.data.filter((p) => p.name.startsWith('Producto e2e traslado '));
    for (const leftover of leftovers) {
      for (const variant of leftover.variants) {
        for (const stock of variant.stocks ?? []) {
          if (Number(stock.quantity) > 0) {
            await admin.call('POST', '/products/inventory-documents', { branchId: stock.branchId, kind: 'EXIT', reason: 'MERMA', comment: 'e2e: limpieza', lines: [{ variantId: variant.id, quantity: Number(stock.quantity) }] });
          }
        }
      }
      await admin.call('DELETE', `/products/${leftover.id}`);
    }
  }
});

test('al cambiar de sucursal en el selector de arriba, el formulario de movimiento se vacía y ya no muestra la existencia de la anterior', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const sku = `E2EB${stamp}`;
  const name = `Producto e2e sucursal ${stamp}`;

  try {
    await login(page);
    await page.waitForLoadState('networkidle');
    await expect.poll(() => page.locator('header select option').count()).toBeGreaterThan(1); // las sucursales cargan tras el login
    const options = await page.locator('header select option').count();
    test.skip(options < 3, 'Hace falta tener al menos dos sucursales para probar el cambio');

    await page.locator('header select').selectOption({ index: 1 });
    const firstBranch = await page.locator('header select').inputValue();
    expect((await admin.call('POST', '/products/simple', { name, description: '', sku, purchasePrice: 4, salePrice: 10, stocks: [{ branchId: firstBranch, quantity: 4 }] })).status).toBeLessThan(300);

    for (const path of ['/inventario/salida', '/inventario/conteo']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.getByLabel('SKU del producto').fill(sku);
      await page.getByRole('button', { name: 'Agregar' }).click();
      await expect(page.getByLabel(path.endsWith('conteo') ? `Contado de ${sku}` : `Cantidad de ${sku}`)).toBeVisible();

      // Otra sucursal: la línea (con la existencia de la primera) no puede quedarse
      await page.locator('header select').selectOption({ index: 2 });
      await expect(page.getByLabel(path.endsWith('conteo') ? `Contado de ${sku}` : `Cantidad de ${sku}`)).toHaveCount(0);
      await expect(page.getByText('Aún no hay productos')).toBeVisible();

      // Al volver a escanear en la nueva sucursal, la existencia es la de esa sucursal (0: el producto solo tiene stock en la primera)
      await page.getByLabel('SKU del producto').fill(sku);
      await page.getByRole('button', { name: 'Agregar' }).click();
      await expect(page.getByLabel(path.endsWith('conteo') ? `Contado de ${sku}` : `Cantidad de ${sku}`)).toBeVisible();
      await expect(page.getByRole('row', { name: new RegExp(sku) }).getByText('0', { exact: true }).first()).toBeVisible();

      await page.locator('header select').selectOption({ index: 1 });
    }
  } finally {
    const leftovers = (await admin.call<ProductsPage>('GET', '/products?search=E2EB&limit=50')).data.data.filter((p) => p.name.startsWith('Producto e2e sucursal '));
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
