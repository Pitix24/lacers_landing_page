import { defineConfig, devices } from '@playwright/test'

// E2E de LACERS CNC. Estrategia y reglas: docs/07-testing/README.md.
const PORT = 5173
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    // Vite prioriza process.env sobre .env.local: vacío fuerza la API en memoria (no toca Neon).
    env: { DATABASE_URL: '' },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
