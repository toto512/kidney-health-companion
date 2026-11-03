import { defineConfig } from '@playwright/test';

const port = 4173;
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.js',
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] } : {},
  },
  webServer: {
    command: 'node serve.mjs',
    env: { PORT: String(port) },
    url: `http://127.0.0.1:${port}/index.html`,
    reuseExistingServer: !process.env.CI,
  },
});
