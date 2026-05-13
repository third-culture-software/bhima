const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({

  // testDir : process.env.E2E_DIR
  //   ? `./test/end-to-end/${process.env.E2E_DIR}`
  //   : './test/end-to-end',

  // testIgnore : process.env.E2E_DIR ? '' : /\/stock\/|\/account\//,

  /* Maximum time one test can run for. */
  timeout : 50 * 1000, // Need longer value for CI

  expect : {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout : 5000,
  },

  /* Run tests in files in parallel */
  fullyParallel : false, // JMC WAS: true (changed for test development)

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly : !!process.env.CI,

  /* Retry on CI only */
  retries : process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  // workers : process.env.CI ? 1 : undefined,
  workers : 1,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter : [
    ['html', process.env.E2E_TEST_SERVER
      ? { open : 'never' }
      : { outputFolder : 'results/playwright-report' }],
    ['junit', {
      outputFile : process.env.TEST_NUM
        ? `results/end-to-end-${process.env.TEST_NUM}-results.xml`
        : 'results/end-to-end-results.xml',
    }],
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use : {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout : 0,

    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL : `http://localhost:${process.env.PORT || 8080}`,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    // trace: 'on-first-retry',
    trace : 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects : [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
      launchOptions : {
        args: [
          // Memory optimization flags for Chrome for Testing
          "--disable-dev-shm-usage", // Reduce /dev/shm usage
          "--disable-gpu", // Disable GPU acceleration in headless
          "--disable-background-networking", // Reduce background network activity
          "--disable-backgrounding-occluded-windows", // Reduce background processing
          "--disable-renderer-backgrounding", // Keep renderer active
          "--disable-features=TranslateUI,VizDisplayCompositor", // Disable non-essential features
          "--no-sandbox", // Reduce security overhead in CI
          "--disable-web-security", // Reduce security checks
          "--disable-extensions", // Disable extensions
          "--disable-plugins", // Disable plugins
          "--disable-default-apps", // Disable default apps
          "--no-first-run", // Skip first-run experience
          "--disable-sync", // Disable sync features
          "--disable-translate", // Disable translation
          "--memory-pressure-off", // Disable memory pressure detection
          "--max_old_space_size=2048", // Limit V8 heap size
          "--js-flags=--max-old-space-size=2048", // Additional V8 memory limit
        ],
      }
    },

    // {
    //   name : 'firefox',
    //   use : { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name : 'webkit',
    //   use : { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name : 'Mobile Chrome',
    //   use : { ...devices['Pixel 5'] },
    // },
    // {
    //   name : 'Mobile Safari',
    //   use : { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name : 'Microsoft Edge',
    //   use:  { channel: 'msedge' },
    // },
    // {
    //   name : 'Google Chrome',
    //   use : { channel: 'chrome' },
    // },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir : 'test-results/',

  /* Run your local dev server before starting the tests */
  // webServer : {
  //   command : 'npm run start',
  //   port : 3000,
  // },
});
