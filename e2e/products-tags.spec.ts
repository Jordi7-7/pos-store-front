import { test, expect } from '@playwright/test';
import { adminApi, creds, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

interface ProductsPage {
  data: Array<{ id: string; name: string; variants: Array<{ id: string; salePrice: number; tags?: Array<{ id: string; name: string }> }> }>;
}

test('editar un producto simple conserva sus etiquetas (defecto: el editor las borraba al guardar)', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const sku = `E2ET${stamp}`;
  const name = `Producto e2e etiqueta ${stamp}`;
  const find = async () => (await admin.call<ProductsPage>('GET', `/products?search=${sku}&limit=5`)).data.data[0];
  // El listado no trae etiquetas: se leen del detalle del producto.
  const tagIds = async () => {
    const id = (await find())?.id;
    const detail = (await admin.call<ProductsPage['data'][number]>('GET', `/products/${id}`)).data;
    return detail.variants[0]?.tags?.map((t) => t.id);
  };

  try {
    const tag = (await admin.call<{ id: string }>('POST', '/products/tags', { name: `e2e-${stamp}` })).data;
    expect((await admin.call('POST', '/products/simple', { name, description: '', sku, purchasePrice: 10, salePrice: 20 })).status).toBe(201);
    const variantId = (await find())?.variants[0]?.id;
    expect(variantId).toBeTruthy();
    await admin.call('PUT', `/products/variants/${variantId}/tags`, { tagIds: [tag.id] });
    expect(await tagIds()).toEqual([tag.id]);

    await login(page);
    await page.locator('header select').selectOption({ index: 1 });
    await page.goto('/inventario/productos');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder(/Buscar por nombre, SKU/).fill(sku);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.getByRole('row', { name: new RegExp(name) }).getByTitle('Editar Ficha de Producto').click();

    // El editor muestra la etiqueta que ya tiene y, al guardar un cambio de precio, no la pierde
    await expect(page.getByText(`e2e-${stamp}`)).toBeVisible();
    await page.getByLabel(/^Venta/).fill('25');
    const updated = page.waitForResponse((r) => /\/products\/[^/]+(\/simple)?$/.test(r.url()) && r.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Guardar Cambios' }).click();
    expect((await updated).status()).toBe(200);

    const after = await find();
    expect(after?.variants[0]?.salePrice).toBe(25);
    expect(await tagIds()).toEqual([tag.id]);
  } finally {
    const leftovers = (await admin.call<ProductsPage>('GET', '/products?search=E2ET&limit=50')).data.data.filter((p) => p.name.startsWith('Producto e2e etiqueta '));
    for (const product of leftovers) await admin.call('DELETE', `/products/${product.id}`);
  }
});
