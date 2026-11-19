import { defineConfig, devices } from '@playwright/test';

// Runs against the static web export. Build it first: npm run build:web
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'off',
  },
  projects: [
    { name: 'logic', testMatch: /logic\.spec\.ts/ },
    {
      name: 'iphone',
      testIgnore: /logic\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
  webServer: {
    command: 'node scripts/serve-web.mjs 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
  },
});
