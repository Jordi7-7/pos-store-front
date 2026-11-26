import { test, expect } from '@playwright/test';
import { adminApi, creds, emptyStock, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

interface Attribute {
  id: string;
  values?: Array<{ id: string; value: string }>;
}
interface ProductsPage {
  data: Array<{ id: string; name: string; variants: Array<{ id: string; stocks?: Array<{ branchId: string; quantity: number }> }> }>;
}

test.setTimeout(90_000);

test('etiquetas: la vista previa, el envío directo a la impresora y el controlador del sistema usan la misma imagen', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const baseSku = `E2EL${stamp}`;
  const name = `Producto e2e etiquetas ${stamp}`;
  let attributeId = '';

  // Una impresora simulada por Web Serial: guarda los bytes que recibiría
  await page.addInitScript(() => {
    const written: number[] = [];
    (window as unknown as { __serialBytes: number[] }).__serialBytes = written;
    const port = {
      readable: null,
      writable: { getWriter: () => ({ write: async (chunk: Uint8Array) => void written.push(...chunk), releaseLock: () => undefined }) },
      open: async () => undefined,
      close: async () => undefined,
    };
    Object.defineProperty(navigator, 'serial', { value: { getPorts: async () => [port], requestPort: async () => port }, configurable: true });
  });

  try {
    const branch = ((await admin.call<{ branches: Array<{ id: string }> }>('GET', '/auth/profile')).data.branches[0]);
    const attribute = (await admin.call<Attribute>('POST', '/products/attributes', { name: `E2E Talla ${stamp}` })).data;
    attributeId = attribute.id;
    const values: Array<{ id: string; value: string }> = [];
    for (const value of ['S', 'M']) values.push((await admin.call<{ id: string; value: string }>('POST', '/products/attributes/values', { attributeId, value })).data);
    expect(
      (await admin.call('POST', '/products/variable', { name, description: '', baseSku, variants: values.map((value) => ({ sku: `${baseSku}-${value.value}`, purchasePrice: 50, salePrice: 100, attributeValues: [{ attributeValueId: value.id }], stocks: [{ branchId: branch?.id, quantity: 0 }] })) })).status,
    ).toBe(201);

    await login(page);
    await page.locator('header select').selectOption({ index: 1 });
    await page.goto('/inventario/productos');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder(/Buscar por nombre, SKU/).fill(baseSku);
    await page.getByPlaceholder(/Buscar por nombre, SKU/).press('Enter');
    const row = page.getByRole('row', { name: new RegExp(name) });
    await expect(row).toBeVisible();
    await row.getByRole('button').first().click(); // seleccionar el producto
    await page.getByRole('button', { name: /Imprimir etiquetas \(1\)/ }).click();

    const dialog = page.getByRole('dialog').filter({ hasText: 'Imprimir etiquetas' });
    // Una etiqueta por variante, y cada una dice cuál es (S, M)
    await expect(dialog.getByText(`${baseSku}-S`).first()).toBeVisible();
    await expect(dialog.getByText(`${baseSku}-M`).first()).toBeVisible();
    // El navegador ya tiene un puerto vinculado, pero nadie lo asignó a las etiquetas: no cuenta como impresora de etiquetas
    await expect(dialog.getByText('Impresora sin conectar')).toBeVisible();

    // La vista previa sale del tamaño elegido
    await dialog.getByRole('button', { name: '50 × 30 mm' }).click();
    const preview = dialog.getByRole("img", { name: new RegExp(`Etiqueta de ${baseSku}`) });
    await expect(preview).toBeVisible();
    await expect(preview).toHaveCSS('aspect-ratio', '50 / 30');
    await dialog.screenshot({ path: '/private/tmp/claude-501/-Users-jordi-dev-personal-pos-store-repo/698c2beb-41b6-4077-8686-404fe52bb5e6/scratchpad/etiquetas-modal.png' });

    // La configuración de la impresora: tamaños, girar, resolución y conexión
    await dialog.getByRole('button', { name: 'Mi impresora' }).click();
    const settings = page.getByRole('dialog').filter({ hasText: 'Mi impresora de etiquetas' });
    await settings.getByRole('button', { name: 'Conectar impresora' }).click();
    await expect(settings.getByText('Conectada')).toBeVisible();
    await expect(settings.getByRole('button', { name: 'Etiqueta de prueba' })).toBeEnabled();
    await settings.getByRole('button', { name: /Girar \(30 × 50\)/ }).click();
    await expect(settings.getByLabel('Ancho de la etiqueta en milímetros')).toHaveValue('30');
    await settings.screenshot({ path: '/private/tmp/claude-501/-Users-jordi-dev-personal-pos-store-repo/698c2beb-41b6-4077-8686-404fe52bb5e6/scratchpad/etiquetas-config.png' });
    await settings.getByRole('button', { name: /Girar \(50 × 30\)/ }).click(); // de vuelta a 50 × 30
    // La etiqueta de prueba manda dos trabajos (medidas y muestra) y calibrar manda las órdenes de calibración
    const bytes = async () => Buffer.from(await page.evaluate(() => (window as unknown as { __serialBytes: number[] }).__serialBytes)).toString('latin1');
    await settings.getByRole('button', { name: /Etiqueta de prueba/ }).click();
    await expect.poll(async () => ((await bytes()).match(/BITMAP 0,0,50,240,0,/g) ?? []).length).toBe(2);
    await settings.getByRole('button', { name: 'Calibrar rollo' }).click();
    await expect.poll(async () => (await bytes()).includes('GAPDETECT\r\nAUTODETECT')).toBe(true);
    await page.evaluate(() => ((window as unknown as { __serialBytes: number[] }).__serialBytes.length = 0));
    await settings.getByRole('button', { name: 'Listo' }).click();
    await expect(dialog.getByText('Impresora conectada')).toBeVisible();

    // Envío directo: lo que recibe la impresora es TSPL con la imagen, del tamaño elegido, con una copia de cada etiqueta
    await dialog.getByRole('button', { name: 'Imprimir 2 etiquetas' }).click();
    await expect(page.getByText(/2 etiquetas enviadas/)).toBeVisible();
    const sent = await page.evaluate(() => (window as unknown as { __serialBytes: number[] }).__serialBytes);
    const text = Buffer.from(sent).toString('latin1');
    expect(text.match(/SIZE 50 mm,30 mm/g)).toHaveLength(2);
    expect(text.match(/BITMAP 0,0,50,240,0,/g)).toHaveLength(2); // 50 mm × 8 = 400 puntos = 50 bytes; 30 mm × 8 = 240 filas
    expect(text.match(/PRINT 1,1/g)).toHaveLength(2);
    expect(sent.length).toBeGreaterThan(2 * 50 * 240); // lleva las imágenes completas

    // Controlador del sistema: una página por etiqueta, con el tamaño exacto
    await dialog.getByRole('button', { name: /Imprimir con el controlador del sistema/ }).click();
    const frame = page.frames().find((candidate) => candidate !== page.mainFrame());
    expect(frame).toBeDefined();
    await expect.poll(async () => frame?.locator('.page').count()).toBe(2);
  } finally {
    const products = (await admin.call<ProductsPage>('GET', `/products?search=${baseSku}&limit=5`)).data.data;
    for (const product of products) {
      for (const variant of product.variants) for (const stock of variant.stocks ?? []) if (Number(stock.quantity) > 0) await emptyStock(admin, stock.branchId, variant.id, Number(stock.quantity));
      await admin.call('DELETE', `/products/${product.id}`);
    }
    if (attributeId) await admin.call('DELETE', `/products/attributes/${attributeId}`);
  }
});
