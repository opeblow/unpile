import { defineConfig, devices } from '@playwright/test';

// Locally on Windows we drive the installed Microsoft Edge (no browser download).
// In CI we use Playwright's bundled Chromium.
const channel = process.env.CI ? undefined : process.env.PW_CHANNEL ?? 'msedge';
// Set BASE_URL to test a live deployment instead of a local build.
const remote = process.env.BASE_URL;

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: remote ?? 'http://localhost:4173',
    channel,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel } },
  ],
  webServer: remote
    ? undefined
    : {
        command: 'npm run build && npm run preview -- --port 4173 --strictPort',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
