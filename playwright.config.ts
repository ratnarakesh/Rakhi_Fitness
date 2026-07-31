import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config — tests run against the real static export in `out/`, served over
 * HTTP, driven by headless Chromium. Service workers are blocked so cached
 * assets never cause flakiness between runs.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4321',
    headless: true,
    serviceWorkers: 'block',
    viewport: { width: 390, height: 844 }, // iPhone 14-ish
    trace: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'python3 -m http.server 4321 --directory out',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
