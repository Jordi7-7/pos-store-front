import { test, expect } from '@playwright/test';
import { adminApi, creds, login } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

interface Supplier {
  id: string;
  name: string;
  identityNumber: string;
  phone?: string;
}

test('proveedores: crear, buscar, editar y eliminar desde la pantalla', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const name = `Proveedor e2e ${stamp}`;
  const identity = `9${stamp}001`;
  const list = async () => (await admin.call<Supplier[]>('GET', '/purchases/suppliers')).data;
  const mine = async () => (await list()).find((s) => s.identityNumber === identity);

  try {
    await login(page);
    await page.goto('/compras/proveedores');
    await page.waitForLoadState('networkidle');

    // 1. Crear: sin nombre el formulario avisa; completo, se guarda
    await page.getByRole('button', { name: 'Nuevo proveedor' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/RUC \/ Identificación/).fill(identity);
    await dialog.getByLabel(/Nombre \/ Razón Social/).fill(name);
    await dialog.getByLabel(/Teléfono/).fill('0991112233');
    const created = page.waitForResponse((r) => r.url().endsWith('/purchases/suppliers') && r.request().method() === 'POST');
    await dialog.getByRole('button', { name: 'Registrar Proveedor' }).click();
    expect((await created).status()).toBe(201);
    expect(await mine()).toMatchObject({ name, phone: '0991112233' });

    // 2. Buscar por identificación
    await page.getByPlaceholder(/Buscar por nombre o RUC/).fill(identity);
    const row = page.getByRole('row', { name: new RegExp(name) });
    await expect(row).toBeVisible();

    // 3. Editar el teléfono
    await row.getByTitle('Editar Proveedor').click();
    await page.getByRole('dialog').getByLabel(/Teléfono/).fill('0994445566');
    const updated = page.waitForResponse((r) => /\/purchases\/suppliers\/[^/]+$/.test(r.url()) && r.request().method() === 'PUT');
    await page.getByRole('dialog').getByRole('button', { name: 'Guardar Cambios' }).click();
    expect((await updated).status()).toBe(200);
    expect((await mine())?.phone).toBe('0994445566');

    // 4. Eliminar
    await row.getByTitle('Eliminar Proveedor').click();
    const removed = page.waitForResponse((r) => /\/purchases\/suppliers\/[^/]+$/.test(r.url()) && r.request().method() === 'DELETE');
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
    expect((await removed).status()).toBeLessThan(300);
    expect(await mine()).toBeUndefined();
  } finally {
    const leftover = await mine();
    if (leftover) await admin.call('DELETE', `/purchases/suppliers/${leftover.id}`);
  }
});

test('un proveedor repetido muestra el texto del catálogo para SUPPLIER_IDENTITY_TAKEN, no el del backend', async ({ page, request }) => {
  const admin = await adminApi(request);
  const stamp = Date.now().toString().slice(-8);
  const identity = `8${stamp}001`;
  const existing = await admin.call<Supplier>('POST', '/purchases/suppliers', { name: `Proveedor e2e dup ${stamp}`, identityNumber: identity });
  expect(existing.status).toBe(201);

  try {
    await login(page);
    await page.goto('/compras/proveedores');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Nuevo proveedor' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/RUC \/ Identificación/).fill(identity);
    await dialog.getByLabel(/Nombre \/ Razón Social/).fill(`Otro nombre ${stamp}`);
    const rejected = page.waitForResponse((r) => r.url().endsWith('/purchases/suppliers') && r.request().method() === 'POST');
    await dialog.getByRole('button', { name: 'Registrar Proveedor' }).click();
    expect((await rejected).status()).toBe(409);
    await expect(page.getByText('Ya existe un proveedor con ese documento.')).toBeVisible();
  } finally {
    await admin.call('DELETE', `/purchases/suppliers/${existing.data.id}`);
  }
});
