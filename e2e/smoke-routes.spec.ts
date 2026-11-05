import { test, expect } from '@playwright/test';
import { creds, login, watchProblems } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

const routes = [
  '/dashboard',
  '/pos',
  '/ventas',
  '/clientes',
  '/usuarios',
  '/multimedia',
  '/configuracion',
  '/cajas/historial',
  '/cajas/registradoras',
  '/compras/historial',
  '/compras/proveedores',
  '/compras/registrar',
  '/inventario/productos',
  '/inventario/lotes',
  '/reportes',
  '/reportes/costo-ventas',
  '/reportes/existencias-valuadas',
  '/reportes/ventas-productos',
];

test('recorrido de humo por rutas protegidas: sin excepciones ni respuestas ≥ 400', async ({ page }) => {
  const problems = watchProblems(page);
  await login(page);
  const failures: string[] = [];
  for (const route of routes) {
    problems.consoleErrors.length = 0;
    problems.badResponses.length = 0;
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    const pageErrors = problems.consoleErrors.filter((e) => e.startsWith('pageerror:'));
    test.info().annotations.push({
      type: route,
      description: `url final ${new URL(page.url()).pathname} | consola: ${problems.consoleErrors.length} | http>=400: ${JSON.stringify(problems.badResponses)}`,
    });
    if (pageErrors.length) failures.push(`${route}: ${pageErrors.join(' | ')}`);
    if (problems.badResponses.length) failures.push(`${route}: ${problems.badResponses.join(', ')}`);
  }
  expect(failures).toEqual([]);
});

test('el dashboard y los reportes muestran importes con la moneda de la tienda (MXN), no con otra', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');
  const text = await page.locator('main').innerText();
  expect(text).toMatch(/\$\s?\d/); // importes con símbolo de peso
  expect(text).not.toMatch(/US\$|USD/);
});
