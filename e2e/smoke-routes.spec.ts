import { test } from '@playwright/test';
import { creds, login, watchProblems } from './helpers';

test.skip(!creds.slug || !creds.user || !creds.pass, 'Faltan credenciales E2E en .env.e2e.local');

const routes = ['/dashboard', '/pos', '/ventas', '/clientes', '/usuarios', '/multimedia', '/configuracion'];

test('recorrido de humo por rutas protegidas (informa, no falla por errores)', async ({ page }) => {
  const problems = watchProblems(page);
  await login(page);
  for (const route of routes) {
    problems.consoleErrors.length = 0;
    problems.badResponses.length = 0;
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    test.info().annotations.push({
      type: route,
      description: `url final ${new URL(page.url()).pathname} | consola: ${problems.consoleErrors.length} | http>=400: ${JSON.stringify(problems.badResponses)}`,
    });
  }
});
