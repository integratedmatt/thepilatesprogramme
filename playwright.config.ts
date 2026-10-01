import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';
// Use a pre-installed Chromium when the pinned Playwright build is absent (CI containers).
const localChrome = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((p) => existsSync(p) && !existsSync(`${p}/chrome-linux`)) || (existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined);
const launchOptions = process.env.PW_USE_INSTALLED ? {} : localChrome ? { executablePath: localChrome } : {};
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: 0,
  use: { baseURL: process.env.BASE_URL || 'http://localhost:4321', trace: 'retain-on-failure', launchOptions },
  webServer: process.env.BASE_URL ? undefined : { command: 'npx astro dev --port 4321 --host 127.0.0.1', url: 'http://localhost:4321', reuseExistingServer: true, timeout: 60_000 },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 780 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
});
