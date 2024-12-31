const { chromium } = require('@playwright/test');
const { test, expect } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const RubricConfigPage = require('./rubrics_config.page');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Rubrics Configuration Management', () => {

  test.beforeEach(async () => {
    await TU.navigate('/#!/payroll/rubric_configuration');
  });

  const page = new RubricConfigPage();

  const rubricConfig = {
    label: 'Configuration 2013',
  };

  const updateRubricConfig = {
    label: 'Configuration 2013 Updated',
  };

  test('successfully creates a new rubric configuration', async () => {
    await page.create(rubricConfig, ['social', 'tax']);
  });

  test('successfully edits a rubric configuration', async () => {
    await page.update(rubricConfig.label, updateRubricConfig);
  });

  test('do not create when incorrect rubric', async () => {
    await page.errorOnCreateRubricConfig();
  });

  test('successfully delete a rubric', async () => {
    await page.remove(updateRubricConfig.label);
  });

  test('should have 2 rubrics to end with', async () => {
    // Make sure the grid is loaded
    await TU.waitForSelector('.ui-grid-canvas .ui-grid-row');
    expect(await page.count()).toBe(2);
  });
});
