const { defineConfig } = require('@playwright/test');
// PW_PORT moves the preview server off 4321 when another checkout already
// serves there; reusing that server would test the other checkout's dist.
const port = process.env.PW_PORT || '4321';
module.exports = defineConfig({
  testDir: '.',
  testMatch: '*.spec.cjs',
  timeout: 120000,
  workers: 4,
  // CI retries a failed test twice so one timing blip on the shared runner
  // does not fail the deploy; Playwright still reports it as flaky. Local
  // runs stay strict.
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['line'], ['github']] : 'list',
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'webkit-smoke', testMatch: /(?:site-smoke|gallery-accessibility|discovery|projects|travel-loading)\.spec\.cjs$/, use: { browserName: 'webkit' } }
  ],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: `node ../../preview-server.mjs ${port}`,
    url: `http://127.0.0.1:${port}/travel`,
    reuseExistingServer: !process.env.CI
  }
});
