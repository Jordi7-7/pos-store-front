import { defineConfig, devices } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';

// Credenciales de prueba: solo en .env.e2e.local (ignorado por git), nunca en el repo.
if (existsSync('.env.e2e.local')) {
  for (const line of readFileSync('.env.e2e.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m?.[1] && process.env[m[1]] === undefined) process.env[m[1]] = m[2] ?? '';
  }
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1, // los recorridos comparten caja y sesión: en serie
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
