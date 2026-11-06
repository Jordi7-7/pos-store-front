import { test, expect } from '@playwright/test';
import { API_URL, adminApi, cashier, creds, pinLogin, resetCashRegister } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass || !cashier.pin, 'Faltan credenciales E2E en .env.e2e.local');

const REGISTER = 'Caja Principal 1';
const SKU = '001'; // en el tenant de pruebas el código 001 lo comparten varios productos: se elige "PANTALON VARIOS LISO"
const PRODUCT = 'PANTALON VARIOS LISO';
const OPENING = 100;

interface SaleResponse {
  id: string;
  cashSessionId: string;
  branchId: string;
  total: number;
  items: Array<{ variantId: string }>;
}
interface DetailsResponse {
  session: { status: string; closingBalance: number; expectedBalance: number; difference: number };
  kpis: { salesCount: number; cashSales: number; totalRefunds: number };
}

test.describe('cajero (login por PIN)', () => {
  test('un PIN correcto entra al POS con el menú reducido a lo que puede usar', async ({ page }) => {
    await pinLogin(page);
    await expect(page.getByText('Punto de Venta (POS)').first()).toBeVisible();
    await expect(page.getByText('Directorio de Clientes')).toBeVisible();
    for (const hidden of ['Personal y Roles', 'Configuración Negocio', 'Reportes y Utilidades']) {
      await expect(page.getByText(hidden)).toHaveCount(0);
    }
  });

  test('un PIN incorrecto avisa y no entra (1 solo intento: el límite de intentos es bajo)', async ({ page }) => {
    await page.goto(`/login/${creds.slug}`);
    await page.waitForLoadState('networkidle');
    for (const digit of '000000') await page.keyboard.press(digit);
    await expect(page.getByText('PIN incorrecto')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('el backend niega al cajero la administración con 403 PERMISSION_DENIED', async ({ request }) => {
    const pin = await request.post(`${API_URL}/auth/pin-login`, { data: { pin: cashier.pin, tenantSlug: creds.slug } });
    const { accessToken } = (await pin.json()) as { accessToken: string };
    for (const path of ['/users', '/roles', '/branches']) {
      const response = await request.get(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      expect(response.status(), path).toBe(403);
      expect(((await response.json()) as { code: string }).code).toBe('PERMISSION_DENIED');
    }
  });

  test('la interfaz no deja al cajero abrir pantallas de administración por URL', async ({ page }) => {
    await pinLogin(page);
    for (const path of ['/usuarios', '/configuracion', '/dashboard', '/reportes/costo-ventas', '/compras/historial', '/cajas/historial']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await expect(page, path).toHaveURL(/\/pos$/);
    }
    await expect(page.getByText('Punto de Venta (POS)').first()).toBeVisible();
  });
});

test.describe('turno completo del cajero', () => {
  test('abrir caja → vender → devolver → cerrar, con el arqueo cuadrado', async ({ page, request }) => {
    const register = await resetCashRegister(request, REGISTER);
    const admin = await adminApi(request);

    await pinLogin(page);

    // 1. Abrir turno
    await page.getByRole('button', { name: /Apertura de Caja/ }).click();
    await page.getByText(REGISTER).click();
    await page.getByPlaceholder('0.00').fill(String(OPENING));
    const opened = page.waitForResponse((r) => r.url().endsWith('/sales/cash-sessions/open') && r.request().method() === 'POST');
    await page.getByRole('button', { name: /Abrir Turno de Caja/ }).click();
    expect((await opened).status()).toBe(201);
    await expect(page.getByText('Caja Cerrada')).toHaveCount(0);

    // 2. Vender
    await page.getByPlaceholder(/Escanea código/).fill(SKU);
    await page.keyboard.press('Enter');
    await page.getByText(PRODUCT).first().click();
    await expect(page.getByText('MONTO TOTAL A COBRAR')).toBeVisible();
    await page.getByPlaceholder('0.00').last().fill('310');
    await page.getByRole('button', { name: 'Agregar' }).click();

    const saleRequest = page.waitForRequest((r) => r.url().endsWith('/sales') && r.method() === 'POST');
    const saleResponse = page.waitForResponse((r) => r.url().endsWith('/sales') && r.request().method() === 'POST');
    await page.getByRole('button', { name: /Completar Venta/ }).click();
    const sale = await saleResponse;
    expect(sale.status()).toBe(201);
    const created = (await sale.json()) as SaleResponse;
    expect(created.total).toBe(310);
    await expect(page.getByText(/001-001-\d{9}/).first()).toBeVisible(); // ticket con folio

    // La web envía un clientRequestId por intento de cobro (el backend lo usa contra duplicados).
    const body = (await saleRequest).postDataJSON() as { clientRequestId?: string };
    expect(body.clientRequestId).toMatch(/^[0-9a-f-]{36}$/);

    // Reintento con la MISMA clave y el mismo contenido: el backend devuelve la venta ya creada.
    const pin = await request.post(`${API_URL}/auth/pin-login`, { data: { pin: cashier.pin, tenantSlug: creds.slug } });
    const { accessToken } = (await pin.json()) as { accessToken: string };
    const replay = await request.post(`${API_URL}/sales`, { headers: { Authorization: `Bearer ${accessToken}` }, data: body });
    expect(replay.status()).toBe(201);
    expect(((await replay.json()) as SaleResponse).id).toBe(created.id);
    await page.keyboard.press('Escape');

    // 3. Devolver (la propietaria, por API: el cajero no tiene la acción en pantalla)
    const refund = await admin.call('POST', '/sales/refunds', {
      branchId: created.branchId,
      saleId: created.id,
      cashSessionId: created.cashSessionId,
      reason: 'e2e: devolución del recorrido de prueba',
      items: [{ variantId: created.items[0]?.variantId, quantity: 1 }],
    });
    expect(refund.status).toBe(201);

    // 4. Cerrar turno: fondo 100 + cobros 310 − devolución 310 = 100 en el cajón
    await page.getByRole('button', { name: /Cerrar Caja/ }).click();
    // El cajero (con abrir/cerrar caja) ve el efectivo esperado real del turno: 100 + 310 − 310 = 100.
    await expect(page.getByText('(=) Efectivo Esperado:')).toBeVisible();
    await expect(page.getByText(/No se pudo cargar el resumen del turno/)).toHaveCount(0);
    await expect(page.getByText('(=) Efectivo Esperado:').locator('xpath=following-sibling::span')).toHaveText(/100[.,]00/);
    await page.getByPlaceholder(/Ingresa el dinero físico/).fill(String(OPENING));
    const closed = page.waitForResponse((r) => /\/sales\/cash-sessions\/[^/]+\/close$/.test(r.url()) && r.request().method() === 'POST');
    await page.getByRole('button', { name: /Cerrar Caja y Emitir Corte Z/ }).click();
    expect((await closed).status()).toBe(201);

    // 5. Verificación contra el backend (la fuente de verdad)
    const details = (await admin.call<DetailsResponse>('GET', `/sales/cash-sessions/${created.cashSessionId}/details`)).data;
    expect(details.session).toMatchObject({ status: 'CLOSED', closingBalance: OPENING, expectedBalance: OPENING, difference: 0 });
    expect(details.kpis).toMatchObject({ salesCount: 1, cashSales: 310, totalRefunds: 310 });

    // La caja queda libre para el siguiente turno
    const active = await admin.call<unknown>('GET', `/sales/cash-sessions/active?branchId=${register.branchId}&cashRegisterId=${register.id}`);
    expect(active.data).toBeFalsy();
  });
});
