import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import JsBarcode from 'jsbarcode';
import { encode } from 'jpeg-js';
import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const creds = {
  slug: process.env.E2E_TENANT_SLUG ?? '',
  user: process.env.E2E_USERNAME ?? '',
  pass: process.env.E2E_PASSWORD ?? '',
};

export async function login(page: Page): Promise<void> {
  await page.goto(`/login/${creds.slug}`);
  await page.getByRole('tab', { name: /Usuario \/ Clave/ }).click();
  await page.getByPlaceholder('cajero1 o admin@tienda.com').fill(creds.user);
  await page.getByPlaceholder('••••••••').fill(creds.pass);
  await page.getByRole('button', { name: /Acceder al Sistema/ }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

/** Recoge errores de consola y respuestas HTTP >= 400 de la API mientras dura la prueba. */
export function watchProblems(page: Page) {
  const consoleErrors: string[] = [];
  const badResponses: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200));
  });
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message.slice(0, 200)}`));
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().includes('localhost:3000')) {
      badResponses.push(`${r.status()} ${r.request().method()} ${new URL(r.url()).pathname}`);
    }
  });
  return { consoleErrors, badResponses };
}

export const cashier = { pin: process.env.E2E_PIN ?? '' };
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

/** Entra por la pantalla de PIN (teclado numérico) y espera a que el POS termine de cargar. */
export async function pinLogin(page: Page, pin: string = cashier.pin): Promise<void> {
  await page.goto(`/login/${creds.slug}`);
  await page.waitForLoadState('networkidle');
  for (const digit of pin.split('')) await page.keyboard.press(digit);
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/pos/, { timeout: 10_000 });
  await page.getByText('Digita tu PIN').waitFor({ state: 'detached', timeout: 10_000 });
}

interface AdminSession {
  token: string;
  call: <T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown) => Promise<{ status: number; data: T }>;
}

/** Deja a 0 el stock de una variante de prueba con una salida manual: un producto con existencias no se puede borrar. */
export async function emptyStock(admin: AdminSession, branchId: string, variantId: string, quantity: number): Promise<void> {
  await admin.call('POST', '/products/inventory-documents', { branchId, kind: 'EXIT', reason: 'MERMA', comment: 'e2e: limpieza', lines: [{ variantId, quantity }] });
}

/** Sesión de la propietaria por API, para preparar y verificar datos sin pasar por la interfaz. */
export async function adminApi(request: APIRequestContext): Promise<AdminSession> {
  const login = await request.post(`${API_URL}/auth/login`, {
    data: { email: creds.user, password: creds.pass, tenantSlug: creds.slug },
  });
  const { accessToken } = (await login.json()) as { accessToken: string };
  return {
    token: accessToken,
    call: async <T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown) => {
      const response = await request.fetch(`${API_URL}${path}`, {
        method,
        headers: { Authorization: `Bearer ${accessToken}` },
        ...(body === undefined ? {} : { data: body }),
      });
      return { status: response.status(), data: (await response.json().catch(() => null)) as T };
    },
  };
}

interface Profile {
  cashRegisters: Array<{ id: string; name: string; branchId: string }>;
}
interface ActiveSession {
  id: string;
}
interface SessionDetails {
  session: { expectedBalance: number };
}

/** Deja la caja sin turno abierto (cierra con el efectivo esperado) para que el test parta de cero. */
export async function resetCashRegister(request: APIRequestContext, registerName: string): Promise<{ id: string; branchId: string }> {
  const admin = await adminApi(request);
  const profile = (await admin.call<Profile>('GET', '/auth/profile')).data;
  const register = profile.cashRegisters.find((r) => r.name === registerName);
  if (!register) throw new Error(`No existe la caja "${registerName}" en el tenant de pruebas`);
  const active = (
    await admin.call<ActiveSession | ''>('GET', `/sales/cash-sessions/active?branchId=${register.branchId}&cashRegisterId=${register.id}`)
  ).data;
  if (active && typeof active === 'object' && active.id) {
    const details = (await admin.call<SessionDetails>('GET', `/sales/cash-sessions/${active.id}/details`)).data;
    await admin.call('POST', `/sales/cash-sessions/${active.id}/close`, { closingBalance: Math.max(0, details.session.expectedBalance) });
  }
  return { id: register.id, branchId: register.branchId };
}

/**
 * Una "cámara" falsa para Chromium: un video (MJPEG, que son JPEG seguidos) de un papel blanco con el código de barras de
 * `code`. El navegador lo entrega como si fuera la cámara real, así se prueba todo el camino: video → lector → pantalla.
 * Se usa con `--use-file-for-fake-video-capture=<archivo>` en `test.use({ launchOptions })`.
 */
export function writeFakeCameraVideo(codes: string | string[], name: string): string {
  const frames = (Array.isArray(codes) ? codes : [codes]).map((code) => {
    const target: { encodings?: Array<{ data: string }> } = {};
    JsBarcode(target, code, { format: 'CODE128' });
    const modules = (target.encodings ?? []).map((encoding) => encoding.data).join('');
    const narrow = 3;
    const width = 640;
    const height = 480;
    const rgba = Buffer.alloc(width * height * 4, 255);
    const left = Math.round((width - modules.length * narrow) / 2);
    for (let y = 140; y < 340; y++) {
      for (let m = 0; m < modules.length; m++) {
        if (modules[m] !== '1') continue;
        for (let dx = 0; dx < narrow; dx++) {
          const i = (y * width + left + m * narrow + dx) * 4;
          rgba[i] = rgba[i + 1] = rgba[i + 2] = 0;
        }
      }
    }
    return encode({ data: rgba, width, height }, 92).data;
  });
  const directory = join(tmpdir(), 'pos-e2e-camera');
  mkdirSync(directory, { recursive: true });
  const file = join(directory, `${name}.mjpeg`);
  // Cada código se muestra unos instantes y el video da la vuelta
  writeFileSync(file, Buffer.concat(frames.flatMap((frame) => Array.from({ length: 20 }, () => frame))));
  return file;
}

export const fakeCameraArgs = (file: string): string[] => ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${file}`];

export interface ProductsPage {
  data: Array<{ id: string; name: string; variants: Array<{ id: string; sku: string; salePrice: number; stocks?: Array<{ branchId: string; quantity: number }> }> }>;
}

/** Borra los productos de prueba que coinciden con la búsqueda; antes vacía sus existencias (un producto con stock no se puede borrar). */
export async function deleteProductsMatching(admin: AdminSession, search: string, keep: (name: string) => boolean = () => true): Promise<void> {
  const products = (await admin.call<ProductsPage>('GET', `/products?search=${encodeURIComponent(search)}&limit=50`)).data.data.filter((product) => keep(product.name));
  for (const product of products) {
    for (const variant of product.variants) {
      for (const stock of variant.stocks ?? []) if (Number(stock.quantity) > 0) await emptyStock(admin, stock.branchId, variant.id, Number(stock.quantity));
    }
    await admin.call('DELETE', `/products/${product.id}`);
  }
}
