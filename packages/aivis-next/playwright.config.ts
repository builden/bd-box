import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/*.smoke.e2e.ts'],
  reporter: [['html', { outputFolder: 'tests/test-results/playwright-report' }]],
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://localhost:3003',
  },
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3003',
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
