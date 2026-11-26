const { defineConfig } = require('@playwright/test');
// PW_PORT moves the preview server off 4321 when another checkout already
// serves there; reusing that server would test the other checkout's dist.
const port = process.env.PW_PORT || '4321';
// PW_SPLIT runs one third of the suite, so CI can run the thirds on three
// machines at once (26 Nov 2026: one runner took about 6 of CI's 7.5 minutes).
// Groups are by file, sized from measured run times (test-seconds, 4 workers);
// Playwright's own --shard keeps file order, which put every travel geometry
// sweep in one shard. 'c' is every file not named in 'a' or 'b', so a new spec
// file always runs somewhere.
const SPLITS = {
  a: ['travel', 'travel-navigation'], // about 240 s
  b: ['projects', 'internship-peek'] // about 230 s; c, the rest, about 250 s
};
const files = names => `[\\\\/](?:${names.map(n => n.replace(/[-.]/g, '\\$&')).join('|')})\\.spec\\.cjs$`;
const split = process.env.PW_SPLIT;
if (split && !['a', 'b', 'c'].includes(split)) throw new Error(`PW_SPLIT must be a, b or c, not "${split}"`);
const testIgnore = !split ? [] : split === 'c' ? new RegExp(files([...SPLITS.a, ...SPLITS.b])) : new RegExp(`^(?!.*${files(SPLITS[split])})`);
module.exports = defineConfig({
  testDir: '.',
  testMatch: '*.spec.cjs',
  testIgnore,
  timeout: 120000,
  // Four everywhere: six failed one or two tests on every busy local run; four passed 3 of 3 in 142-147 s (15 Nov 2026).
  workers: 4,
  // Every test opens its own page and shares no state, so tests of one file can
  // run on different workers. Serial files left one worker running projects.spec
  // (23 tests, about 90 s in WebKit) after the other three had finished.
  fullyParallel: true,
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
