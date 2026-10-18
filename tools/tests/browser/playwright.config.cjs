const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: '.',
  testMatch: '*.spec.cjs',
  timeout: 120000,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? [['line'], ['github']] : 'list',
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit-smoke', testMatch: /(?:site-smoke|gallery-accessibility|discovery)\.spec\.cjs$/, use: { browserName: 'webkit' } }
  ],
  use: {
    baseURL: 'http://127.0.0.1:4321',
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node ../../preview-server.mjs 4321',
    url: 'http://127.0.0.1:4321/travel',
    reuseExistingServer: !process.env.CI
  }
});
