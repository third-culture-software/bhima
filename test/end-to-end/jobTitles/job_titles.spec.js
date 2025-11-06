const { chromium } = require('@playwright/test');
const { test } = require('@playwright/test');
const TU = require('../shared/TestUtils');

const { notification } = require('../shared/components');
const JobTitlePage = require('./job_titles.page');

test.beforeAll(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  TU.registerPage(page);
  await TU.login();
});

test.describe('Job Titles Management', () => {
  test.beforeEach(async () => {
    await TU.navigate('/#!/titles');
  });

  const page = new JobTitlePage();

  const newJobTitle = 'Administrator Manager';
  const updateJobTitle = 'Physiotherapist';

  test('successfully creates a new job title', async () => {
    await page.create(newJobTitle);
    await notification.hasSuccess();
  });

  test('successfully edits a job title', async () => {
    await page.update(newJobTitle, updateJobTitle);
    await notification.hasSuccess();
  });

  test('errors when missing job tit create when incorrect job title', async () => {
    await page.errorOnCreateFunction();
  });

  test('successfully delete a job title', async () => {
    await page.remove(updateJobTitle);
    await notification.hasSuccess();
  });
});
